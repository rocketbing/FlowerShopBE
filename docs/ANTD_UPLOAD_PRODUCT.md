# 使用 Ant Design Upload 上传产品图片

## 完整示例（React + Ant Design）

### 1. 基础示例

```jsx
import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Upload, message, Card } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Option } = Select;

function CreateProductForm() {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 处理文件上传前的验证
  const beforeUpload = (file) => {
    // 验证文件类型
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return Upload.LIST_IGNORE;
    }

    // 验证文件大小（10MB）
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB！');
      return Upload.LIST_IGNORE;
    }

    // 只允许上传一张图片
    if (fileList.length >= 1) {
      message.warning('只能上传一张图片！');
      return Upload.LIST_IGNORE;
    }

    return false; // 阻止自动上传，手动控制
  };

  // 处理文件列表变化
  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // 提交表单
  const onFinish = async (values) => {
    // 检查是否上传了图片
    if (fileList.length === 0) {
      message.error('请上传产品图片！');
      return;
    }

    setLoading(true);

    try {
      // 创建 FormData
      const formData = new FormData();

      // 添加产品信息
      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key].toString());
        }
      });

      // 添加图片文件（fileList[0].originFileObj 是原始文件对象）
      if (fileList[0]?.originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }

      // 获取 token
      const token = localStorage.getItem('token');

      // 发送请求
      const response = await axios.post(
        'http://localhost:3000/api/products',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        message.success('产品创建成功！');
        form.resetFields();
        setFileList([]);
        // 可以跳转到产品列表
      }
    } catch (error) {
      message.error(
        error.response?.data?.message || '创建产品失败，请重试'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="创建新产品" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          stems: 12,
          quantity: 1,
          category: 'roses',
          popularity: 3,
        }}
      >
        <Form.Item
          label="产品名称"
          name="name"
          rules={[{ required: true, message: '请输入产品名称' }]}
        >
          <Input placeholder="例如：Red Roses Bouquet" />
        </Form.Item>

        <Form.Item
          label="产品描述"
          name="description"
          rules={[{ required: true, message: '请输入产品描述' }]}
        >
          <TextArea rows={4} placeholder="例如：Beautiful red roses arranged in a bouquet" />
        </Form.Item>

        <Form.Item
          label="花的头数"
          name="stems"
          rules={[{ required: true, message: '请输入花的头数' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="颜色"
          name="color"
          rules={[{ required: true, message: '请输入颜色' }]}
        >
          <Input placeholder="例如：red" />
        </Form.Item>

        <Form.Item
          label="正常价格"
          name="regularPrice"
          rules={[{ required: true, message: '请输入正常价格' }]}
        >
          <InputNumber
            min={0}
            step={0.01}
            style={{ width: '100%' }}
            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item label="折扣价格" name="discountedPrice">
          <InputNumber
            min={0}
            step={0.01}
            style={{ width: '100%' }}
            formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          label="数量"
          name="quantity"
          rules={[{ required: true, message: '请输入数量' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="流行程度"
          name="popularity"
        >
          <InputNumber min={1} max={5} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="分类"
          name="category"
          rules={[{ required: true, message: '请选择分类' }]}
        >
          <Select placeholder="请选择分类">
            <Option value="roses">Roses</Option>
            <Option value="tulips">Tulips</Option>
            <Option value="lilies">Lilies</Option>
            <Option value="sunflowers">Sunflowers</Option>
            <Option value="orchids">Orchids</Option>
            <Option value="carnations">Carnations</Option>
            <Option value="mixed">Mixed</Option>
            <Option value="other">Other</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="产品图片"
          required
          rules={[
            {
              validator: () => {
                if (fileList.length === 0) {
                  return Promise.reject(new Error('请上传产品图片'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Upload
            listType="picture-card"
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={handleChange}
            onRemove={() => {
              setFileList([]);
              return true;
            }}
            maxCount={1}
            accept="image/*"
          >
            {fileList.length < 1 && (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item label="图片描述" name="alt">
          <Input placeholder="例如：Red roses bouquet" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            创建产品
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default CreateProductForm;
```

### 2. 使用自定义上传（更灵活）

```jsx
import React, { useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Upload, message, Card } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Option } = Select;

function CreateProductForm() {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 文件验证
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB！');
      return false;
    }

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target.result);
    };
    reader.readAsDataURL(file);

    return false; // 阻止自动上传
  };

  // 处理文件变化
  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // 删除文件
  const handleRemove = () => {
    setFileList([]);
    setPreviewImage('');
    return true;
  };

  // 提交表单
  const onFinish = async (values) => {
    if (fileList.length === 0) {
      message.error('请上传产品图片！');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // 添加产品字段
      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key].toString());
        }
      });

      // 添加图片
      if (fileList[0]?.originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }

      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:3000/api/products',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        message.success('产品创建成功！');
        form.resetFields();
        setFileList([]);
        setPreviewImage('');
      }
    } catch (error) {
      message.error(
        error.response?.data?.message || '创建产品失败，请重试'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="创建新产品" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          stems: 12,
          quantity: 1,
          category: 'roses',
          popularity: 3,
        }}
      >
        {/* 表单字段... */}
        
        <Form.Item
          label="产品图片"
          required
        >
          <Upload
            listType="picture-card"
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={handleChange}
            onRemove={handleRemove}
            maxCount={1}
            accept="image/*"
          >
            {fileList.length < 1 && (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            )}
          </Upload>
          
          {previewImage && (
            <div style={{ marginTop: 16 }}>
              <img
                src={previewImage}
                alt="预览"
                style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 4 }}
              />
            </div>
          )}
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            创建产品
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
```

### 3. 使用 Dragger 上传（拖拽上传）

```jsx
import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

function ImageUpload({ fileList, setFileList }) {
  const props = {
    name: 'image',
    multiple: false,
    fileList: fileList,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('图片大小不能超过 10MB！');
        return false;
      }
      return false;
    },
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    onRemove: () => {
      setFileList([]);
      return true;
    },
  };

  return (
    <Dragger {...props} maxCount={1}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
      <p className="ant-upload-hint">
        支持单个图片上传，仅支持 JPEG, PNG, WebP, GIF 格式，最大 10MB
      </p>
    </Dragger>
  );
}
```

### 4. 完整表单示例（带样式）

```jsx
import React, { useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Upload,
  message,
  Card,
  Row,
  Col,
  Space,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Option } = Select;

function CreateProductForm() {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件！');
      return Upload.LIST_IGNORE;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('图片大小不能超过 10MB！');
      return Upload.LIST_IGNORE;
    }

    if (fileList.length >= 1) {
      message.warning('只能上传一张图片！');
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const onFinish = async (values) => {
    if (fileList.length === 0) {
      message.error('请上传产品图片！');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // 添加所有字段
      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key].toString());
        }
      });

      // 添加图片
      if (fileList[0]?.originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }

      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:3000/api/products',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        message.success('产品创建成功！');
        form.resetFields();
        setFileList([]);
      }
    } catch (error) {
      message.error(
        error.response?.data?.message || '创建产品失败，请重试'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="创建新产品" style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          stems: 12,
          quantity: 1,
          category: 'roses',
          popularity: 3,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="产品名称"
              name="name"
              rules={[{ required: true, message: '请输入产品名称' }]}
            >
              <Input placeholder="例如：Red Roses Bouquet" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="分类"
              name="category"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select placeholder="请选择分类">
                <Option value="roses">Roses</Option>
                <Option value="tulips">Tulips</Option>
                <Option value="lilies">Lilies</Option>
                <Option value="sunflowers">Sunflowers</Option>
                <Option value="orchids">Orchids</Option>
                <Option value="carnations">Carnations</Option>
                <Option value="mixed">Mixed</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="产品描述"
          name="description"
          rules={[{ required: true, message: '请输入产品描述' }]}
        >
          <TextArea rows={4} placeholder="例如：Beautiful red roses arranged in a bouquet" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="花的头数"
              name="stems"
              rules={[{ required: true, message: '请输入花的头数' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="颜色"
              name="color"
              rules={[{ required: true, message: '请输入颜色' }]}
            >
              <Input placeholder="例如：red" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label="数量"
              name="quantity"
              rules={[{ required: true, message: '请输入数量' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="正常价格"
              name="regularPrice"
              rules={[{ required: true, message: '请输入正常价格' }]}
            >
              <InputNumber
                min={0}
                step={0.01}
                style={{ width: '100%' }}
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label="折扣价格" name="discountedPrice">
              <InputNumber
                min={0}
                step={0.01}
                style={{ width: '100%' }}
                formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="流行程度" name="popularity">
          <InputNumber min={1} max={5} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="产品图片"
          required
          rules={[
            {
              validator: () => {
                if (fileList.length === 0) {
                  return Promise.reject(new Error('请上传产品图片'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Upload
            listType="picture-card"
            fileList={fileList}
            beforeUpload={beforeUpload}
            onChange={handleChange}
            onRemove={() => {
              setFileList([]);
              return true;
            }}
            maxCount={1}
            accept="image/*"
          >
            {fileList.length < 1 && (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item label="图片描述" name="alt">
          <Input placeholder="例如：Red roses bouquet" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              创建产品
            </Button>
            <Button onClick={() => {
              form.resetFields();
              setFileList([]);
            }}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default CreateProductForm;
```

## 关键配置说明

### 1. Upload 组件关键属性

```jsx
<Upload
  listType="picture-card"      // 图片卡片样式
  fileList={fileList}          // 文件列表（受控）
  beforeUpload={beforeUpload}  // 上传前验证
  onChange={handleChange}      // 文件变化回调
  onRemove={handleRemove}      // 删除文件回调
  maxCount={1}                 // 最多上传1个文件
  accept="image/*"             // 只接受图片文件
>
```

### 2. beforeUpload 返回值的含义

```javascript
// 返回 false - 阻止自动上传，手动控制
beforeUpload={(file) => {
  // 验证逻辑
  return false; // 阻止自动上传
}}

// 返回 Upload.LIST_IGNORE - 不上传且不显示在列表中
beforeUpload={(file) => {
  if (验证失败) {
    return Upload.LIST_IGNORE;
  }
  return false;
}}
```

### 3. 获取文件对象

```javascript
// 在提交时获取文件
if (fileList[0]?.originFileObj) {
  formData.append('image', fileList[0].originFileObj);
}
```

### 4. 文件验证

```javascript
const beforeUpload = (file) => {
  // 1. 验证文件类型
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件！');
    return Upload.LIST_IGNORE;
  }

  // 2. 验证文件大小（10MB）
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error('图片大小不能超过 10MB！');
    return Upload.LIST_IGNORE;
  }

  // 3. 限制数量
  if (fileList.length >= 1) {
    message.warning('只能上传一张图片！');
    return Upload.LIST_IGNORE;
  }

  return false; // 阻止自动上传
};
```

## 不同上传样式

### 1. picture-card（图片卡片）

```jsx
<Upload
  listType="picture-card"
  fileList={fileList}
  beforeUpload={beforeUpload}
  onChange={handleChange}
>
  {fileList.length < 1 && (
    <div>
      <UploadOutlined />
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  )}
</Upload>
```

### 2. picture（图片列表）

```jsx
<Upload
  listType="picture"
  fileList={fileList}
  beforeUpload={beforeUpload}
  onChange={handleChange}
>
  <Button icon={<UploadOutlined />}>上传图片</Button>
</Upload>
```

### 3. text（文本列表）

```jsx
<Upload
  listType="text"
  fileList={fileList}
  beforeUpload={beforeUpload}
  onChange={handleChange}
>
  <Button icon={<UploadOutlined />}>上传图片</Button>
</Upload>
```

### 4. Dragger（拖拽上传）

```jsx
<Upload.Dragger
  fileList={fileList}
  beforeUpload={beforeUpload}
  onChange={handleChange}
>
  <p className="ant-upload-drag-icon">
    <InboxOutlined />
  </p>
  <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
</Upload.Dragger>
```

## 完整工作流程

1. **用户选择图片** → `beforeUpload` 验证
2. **验证通过** → 添加到 `fileList`
3. **显示预览** → Upload 组件自动显示
4. **提交表单** → 从 `fileList[0].originFileObj` 获取文件
5. **创建 FormData** → 添加所有字段和图片
6. **发送请求** → POST 到 `/api/products`

## 注意事项

### ✅ 正确做法

1. **使用 `originFileObj` 获取原始文件**
   ```javascript
   formData.append('image', fileList[0].originFileObj);
   ```

2. **返回 `false` 阻止自动上传**
   ```javascript
   beforeUpload={(file) => {
     // 验证
     return false; // 手动控制上传
   }}
   ```

3. **使用受控组件**
   ```javascript
   const [fileList, setFileList] = useState([]);
   <Upload fileList={fileList} onChange={handleChange} />
   ```

### ❌ 错误做法

1. **不要使用 `customRequest` 自动上传**
   ```javascript
   // ❌ 错误：会立即上传到服务器
   customRequest={async ({ file, onSuccess }) => {
     // 自动上传逻辑
   }}
   ```

2. **不要直接使用 `file` 对象**
   ```javascript
   // ❌ 可能不准确
   formData.append('image', file);
   
   // ✅ 正确
   formData.append('image', fileList[0].originFileObj);
   ```

## 总结

使用 Ant Design Upload 组件的关键点：

1. ✅ 使用 `beforeUpload` 返回 `false` 阻止自动上传
2. ✅ 使用受控的 `fileList` 状态
3. ✅ 在提交时从 `fileList[0].originFileObj` 获取文件
4. ✅ 添加文件类型和大小验证
5. ✅ 使用 `maxCount={1}` 限制上传数量
6. ✅ 使用 `listType="picture-card"` 显示预览

按照这些示例，你就可以在 Ant Design 表单中成功上传产品图片了！🎉

