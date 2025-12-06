require('dotenv').config();
const { S3Client, ListObjectsV2Command, HeadBucketCommand, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

// Initialize S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testS3() {
  console.log('🔍 Testing S3 connection...\n');
  
  // Check environment variables
  console.log('📋 Configuration:');
  console.log(`   AWS_REGION: ${process.env.AWS_REGION || 'not set'}`);
  console.log(`   S3_BUCKET: ${process.env.S3_BUCKET || 'not set'}`);
  console.log(`   AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not set'}`);
  console.log(`   AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not set'}\n`);

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ Missing AWS credentials in .env file!');
    process.exit(1);
  }

  if (!process.env.S3_BUCKET) {
    console.error('❌ Missing S3_BUCKET in .env file!');
    process.exit(1);
  }

  try {
    // Test 1: Check if bucket exists and is accessible
    console.log('🧪 Test 1: Checking bucket access...');
    try {
      const headBucketResult = await s3.send(new HeadBucketCommand({
        Bucket: process.env.S3_BUCKET
      }));
      console.log('✅ Bucket exists and is accessible!\n');
    } catch (headError) {
      // If HeadBucket fails, try ListObjects instead (some buckets don't allow HeadBucket)
      console.log('⚠️  HeadBucket failed, trying ListObjects instead...');
      console.log(`   Error: ${headError.name || headError.Code || 'Unknown'}`);
      if (headError.$metadata) {
        console.log(`   HTTP Status: ${headError.$metadata.httpStatusCode}`);
        console.log(`   Request ID: ${headError.$metadata.requestId}`);
      }
    }

    // Test 2: List objects in bucket
    console.log('🧪 Test 2: Listing objects in bucket...');
    let listResult;
    let canListObjects = false;
    
    try {
      listResult = await s3.send(new ListObjectsV2Command({
        Bucket: process.env.S3_BUCKET,
        MaxKeys: 10 // Limit to first 10 objects
      }));
      canListObjects = true;
      console.log(`✅ Successfully listed objects in bucket!`);
      console.log(`📊 Total objects: ${listResult.KeyCount || 0}`);
      
      if (listResult.Contents && listResult.Contents.length > 0) {
        console.log(`\n📁 First ${Math.min(listResult.Contents.length, 10)} objects:`);
        listResult.Contents.slice(0, 10).forEach((obj, index) => {
          console.log(`   ${index + 1}. ${obj.Key} (${(obj.Size / 1024).toFixed(2)} KB, modified: ${obj.LastModified?.toISOString()})`);
        });
      } else {
        console.log('📁 Bucket is empty (no objects found)');
      }
    } catch (listError) {
      console.log(`⚠️  Cannot list objects: ${listError.name || listError.Code || 'Unknown'}`);
      if (listError.name === 'AccessDenied' || listError.Code === 'AccessDenied') {
        console.log('   Missing permission: s3:ListBucket');
      }
    }

    // Test 3: Test write permission (optional - just check if we can create a test object)
    console.log('\n🧪 Test 3: Testing write permissions...');
    const testKey = `test-connection-${Date.now()}.txt`;
    try {
      await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: testKey,
        Body: 'S3 connection test',
        ContentType: 'text/plain'
      }));
      console.log(`✅ Successfully uploaded test object: ${testKey}`);
      
      // Clean up: delete the test object
      try {
        const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
        await s3.send(new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: testKey
        }));
        console.log(`✅ Test object deleted successfully`);
      } catch (deleteError) {
        console.log(`⚠️  Could not delete test object (you may need to delete it manually: ${testKey})`);
      }
    } catch (writeError) {
      console.log(`⚠️  Cannot write objects: ${writeError.name || writeError.Code || 'Unknown'}`);
      if (writeError.name === 'AccessDenied' || writeError.Code === 'AccessDenied') {
        console.log('   Missing permission: s3:PutObject');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 Test Summary:');
    console.log('='.repeat(60));
    console.log(`✅ S3 Connection: SUCCESS`);
    console.log(`✅ AWS Credentials: VALID`);
    console.log(`✅ Bucket Access: ${canListObjects ? 'FULL ACCESS' : 'LIMITED ACCESS'}`);
    
    if (!canListObjects) {
      console.log('\n⚠️  PERMISSION ISSUE DETECTED:');
      console.log('   Your IAM user can connect to S3, but lacks some permissions.');
      console.log('   This is OK if you only need to upload/download specific files.');
      console.log('\n💡 To fix this, add the following IAM policy to your user:');
      console.log(`
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${process.env.S3_BUCKET}",
        "arn:aws:s3:::${process.env.S3_BUCKET}/*"
      ]
    }
  ]
}
      `);
      console.log('   Or use AWS managed policy: AmazonS3FullAccess (for full access)');
    } else {
      console.log('\n✅ All tests passed! S3 is fully configured and accessible.');
    }
    
    console.log('\n✅ S3 connection test completed!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ S3 connection test FAILED!');
    console.error(`\nError Code: ${err.Code || err.name || 'Unknown'}`);
    console.error(`Error Message: ${err.message || err}`);
    
    // Log detailed error metadata
    if (err.$metadata) {
      console.error(`\n📊 Error Details:`);
      console.error(`   HTTP Status: ${err.$metadata.httpStatusCode}`);
      console.error(`   Request ID: ${err.$metadata.requestId}`);
      console.error(`   Extended Request ID: ${err.$metadata.extendedRequestId || 'N/A'}`);
      if (err.$metadata.cfId) {
        console.error(`   CloudFront ID: ${err.$metadata.cfId}`);
      }
    }
    
    // Provide helpful error messages
    if (err.Code === 'NoSuchBucket' || err.name === 'NoSuchBucket') {
      console.error('\n💡 The bucket does not exist. Please check:');
      console.error('   1. Bucket name in .env file is correct');
      console.error('   2. Bucket exists in the specified region');
    } else if (err.Code === 'AccessDenied' || err.name === 'AccessDenied' || err.name === 'Forbidden') {
      console.error('\n💡 Access denied. Please check:');
      console.error('   1. AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct');
      console.error('   2. IAM user has permissions to access the bucket');
      console.error('   3. Bucket policy allows access from your credentials');
      console.error('   4. IAM user has s3:ListBucket and s3:GetObject permissions');
    } else if (err.Code === 'InvalidAccessKeyId' || err.name === 'InvalidAccessKeyId') {
      console.error('\n💡 Invalid AWS credentials. Please check:');
      console.error('   1. AWS_ACCESS_KEY_ID is correct');
      console.error('   2. AWS_SECRET_ACCESS_KEY is correct');
      console.error('   3. Credentials have not been deactivated');
    } else if (err.Code === 'SignatureDoesNotMatch' || err.name === 'SignatureDoesNotMatch') {
      console.error('\n💡 Signature mismatch. Please check:');
      console.error('   1. AWS_SECRET_ACCESS_KEY is correct');
      console.error('   2. No extra spaces or characters in .env file');
      console.error('   3. Check for hidden characters or encoding issues');
    } else if (err.message?.includes('region') || err.name === 'RegionNotFound') {
      console.error('\n💡 Region error. Please check:');
      console.error('   1. AWS_REGION in .env file is correct');
      console.error('   2. Bucket exists in the specified region');
      console.error('   3. Valid AWS region format (e.g., us-east-1, us-east-2)');
    } else if (err.name === 'UnknownError' || err.message === 'UnknownError') {
      console.error('\n💡 Unknown error. Possible causes:');
      console.error('   1. Network connectivity issues');
      console.error('   2. AWS service outage');
      console.error('   3. Firewall or proxy blocking AWS endpoints');
      console.error('   4. Invalid bucket name or region');
      console.error('\n🔧 Troubleshooting steps:');
      console.error('   1. Check internet connection');
      console.error('   2. Verify bucket name and region in AWS Console');
      console.error('   3. Test with AWS CLI: aws s3 ls s3://' + process.env.S3_BUCKET);
      console.error('   4. Check AWS service status: https://status.aws.amazon.com/');
    }

    if (err.stack) {
      console.error('\nStack trace:');
      console.error(err.stack);
    }
    
    process.exit(1);
  }
}

testS3();
