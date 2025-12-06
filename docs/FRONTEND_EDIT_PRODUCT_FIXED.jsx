import React, { useState, useMemo, useEffect } from "react";
import CustomTable from "../../../components/CustomTable";
import { getAllProductAsync, editProductAsync, deleteProductAsync } from "../../../store/products";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { Button, Form, Modal, Input, InputNumber, message, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { req } from "../../../utils/request";

const { TextArea } = Input;

export default function ManageProducts() {
    const dispatch = useAppDispatch();
    const productsState = useAppSelector((state) => state.products.products);
    const { data: allData, loading, error, total } = productsState;

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(2);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [previewUrl, setPreviewUrl] = useState(""); // 用于预览的临时 URL
    const [uploading, setUploading] = useState(false);
    const [form] = Form.useForm();

    // 图片上传前的验证
    const beforeUpload = (file) => {
        const isImage = file.type.startsWith("image/");
        if (!isImage) {
            message.error("You can only upload image files!");
            return Upload.LIST_IGNORE;
        }

        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            message.error("Image must be smaller than 10MB!");
            return Upload.LIST_IGNORE;
        }

        // 创建预览 URL
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);

        return false; // 阻止自动上传，我们将手动处理
    };

    // 处理文件列表变化
    const handleImageChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        
        // 如果有新文件，更新预览
        if (newFileList.length > 0 && newFileList[0].originFileObj) {
            const preview = URL.createObjectURL(newFileList[0].originFileObj);
            setPreviewUrl(preview);
        } else if (newFileList.length === 0) {
            // 如果没有文件，恢复原始图片预览
            if (selectedProduct) {
                const currentImageUrl = 
                    typeof selectedProduct.images === "object" && selectedProduct.images?.presignedUrl
                        ? selectedProduct.images.presignedUrl
                        : typeof selectedProduct.images === "object" && selectedProduct.images?.url
                        ? selectedProduct.images.url
                        : typeof selectedProduct.image === "string"
                        ? selectedProduct.image
                        : "";
                setPreviewUrl(currentImageUrl);
            }
        }
    };

    // 移除图片
    const handleRemove = () => {
        // 清理临时预览 URL
        if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }

        setFileList([]);
        
        // 恢复原始图片预览
        if (selectedProduct) {
            const currentImageUrl = 
                typeof selectedProduct.images === "object" && selectedProduct.images?.presignedUrl
                    ? selectedProduct.images.presignedUrl
                    : typeof selectedProduct.images === "object" && selectedProduct.images?.url
                    ? selectedProduct.images.url
                    : typeof selectedProduct.image === "string"
                    ? selectedProduct.image
                    : "";
            setPreviewUrl(currentImageUrl);
        } else {
            setPreviewUrl("");
        }
    };

    const handleEdit = (id) => {
        // 从所有数据中找到要编辑的产品
        const product = allData.find((p) => p.id === id);
        if (product) {
            setSelectedProduct(product);
            setIsEditModalOpen(true);

            // 获取当前图片 URL（优先使用 presignedUrl，否则使用 url）
            const currentImageUrl = 
                typeof product.images === "object" && product.images?.presignedUrl
                    ? product.images.presignedUrl
                    : typeof product.images === "object" && product.images?.url
                    ? product.images.url
                    : typeof product.image === "string"
                    ? product.image
                    : "";

            // 重置文件列表和预览 URL
            setFileList([]);
            setPreviewUrl(currentImageUrl);

            // 设置表单默认值
            form.setFieldsValue({
                name: product.name || "",
                description: product.description || "",
                stems: product.stems || 12,
                color: product.color || "",
                regularPrice: product.regularPrice || 0,
                discountedPrice: product.discountedPrice || null,
                quantity: product.quantity || 0,
                category: product.category || "",
                popularity: product.popularity || 3,
            });
        }
    };

    const handleCancelEdit = () => {
        // 清理临时预览 URL
        if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }

        setIsEditModalOpen(false);
        setSelectedProduct(null);
        setFileList([]);
        setPreviewUrl("");
        form.resetFields();
    };

    const handleSubmitEdit = async (values) => {
        if (!selectedProduct) return;

        setUploading(true);

        try {
            // 检查是否有新上传的图片
            const hasNewImage = fileList.length > 0 && fileList[0].originFileObj;

            if (hasNewImage) {
                // 方式 1：使用 multipart/form-data 上传新图片
                const formData = new FormData();

                // 添加产品字段（数字转字符串）
                Object.keys(values).forEach((key) => {
                    if (values[key] !== undefined && values[key] !== null) {
                        formData.append(key, values[key].toString());
                    }
                });

                // 添加图片文件
                formData.append('image', fileList[0].originFileObj);

                // 添加图片描述（如果有）
                if (values.alt) {
                    formData.append('alt', values.alt);
                }

                // 获取 token
                const token = localStorage.getItem('token') || '';

                // 调用更新 API（PUT /api/products/:id）
                const response = await req(
                    `/products/${selectedProduct.id}`,
                    "PUT",
                    formData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            // 不要设置 Content-Type，让浏览器自动设置 multipart/form-data
                        },
                    }
                );

                if (response.success) {
                    message.success("Product updated successfully!");
                    
                    // 清理临时 URL
                    if (previewUrl && previewUrl.startsWith("blob:")) {
                        URL.revokeObjectURL(previewUrl);
                    }
                    
                    setIsEditModalOpen(false);
                    setSelectedProduct(null);
                    setFileList([]);
                    setPreviewUrl("");
                    form.resetFields();

                    // 重新获取产品列表以刷新数据
                    dispatch(getAllProductAsync());
                } else {
                    throw new Error(response.message || "Failed to update product");
                }
            } else {
                // 方式 2：使用 application/json（没有新图片，只更新其他字段）
                const updatedProduct = {
                    ...values,
                    // 保持原有图片 URL（如果有）
                    images: selectedProduct.images || {
                        url: selectedProduct.images?.url || selectedProduct.image || "",
                        alt: selectedProduct.images?.alt || "",
                    },
                };

                await dispatch(editProductAsync(updatedProduct)).unwrap();
                message.success("Product updated successfully!");
                
                // 清理临时 URL
                if (previewUrl && previewUrl.startsWith("blob:")) {
                    URL.revokeObjectURL(previewUrl);
                }
                
                setIsEditModalOpen(false);
                setSelectedProduct(null);
                setFileList([]);
                setPreviewUrl("");
                form.resetFields();

                // 重新获取产品列表以刷新数据
                dispatch(getAllProductAsync());
            }
        } catch (error) {
            console.error("Update error:", error);
            message.error(error?.message || error || "Failed to update product");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await dispatch(deleteProductAsync(id)).unwrap();
            message.success("Product deleted successfully!");
            dispatch(getAllProductAsync());
        } catch (error) {
            message.error(error || "Failed to delete product");
        }
    };

    useEffect(() => {
        dispatch(getAllProductAsync());
    }, [dispatch]);

    // 清理临时 URL（组件卸载时）
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            width: 150,
            align: "center",
            key: "name",
        },
        {
            title: "Image",
            dataIndex: "images",
            width: 200,
            align: "center",
            render: (text, record) => {
                const imageUrl = 
                    typeof record.images === "object" && record.images?.presignedUrl
                        ? record.images.presignedUrl
                        : typeof record.images === "object" && record.images?.url
                        ? record.images.url
                        : typeof record.image === "string"
                        ? record.image
                        : "";
                
                return imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={record.images?.alt || record.name || "Product"}
                        style={{
                            width: "100%",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "4px",
                        }}
                        onError={(e) => {
                            e.target.style.display = "none";
                        }}
                    />
                ) : (
                    <span>No Image</span>
                );
            },
            key: "image",
        },
        {
            title: "Description",
            dataIndex: "description",
            width: 250,
            align: "center",
            key: "description",
        },
        {
            title: "RegularPrice",
            dataIndex: "regularPrice",
            width: 100,
            align: "center",
            key: "regularPrice",
        },
        {
            title: "SalePrice",
            dataIndex: "discountedPrice",
            width: 100,
            align: "center",
            key: "salePrice",
        },
        {
            title: "Stock",
            dataIndex: "quantity",
            width: 100,
            align: "center",
            key: "stock",
        },
        {
            title: "Category",
            dataIndex: "category",
            width: 100,
            align: "center",
            key: "category",
        },
        {
            title: "Popularity",
            dataIndex: "popularity",
            width: 100,
            align: "center",
            key: "popularity",
        },
        {
            title: "Actions",
            dataIndex: "actions",
            width: 150,
            align: "center",
            key: "actions",
            render: (text, record) => (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Button
                        type="primary"
                        onClick={() => handleEdit(record.id)}
                        style={{ width: "100%" }}
                    >
                        Edit
                    </Button>
                    <Button
                        danger
                        onClick={() => handleDelete(record.id)}
                        style={{ width: "100%" }}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    const paginatedData = useMemo(() => {
        if (!allData || allData.length === 0) {
            return [];
        }
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return allData.slice(startIndex, endIndex);
    }, [currentPage, pageSize, allData]);

    const paginationTotal = total || allData?.length || 0;

    const pageChange = (page, newPageSize) => {
        setCurrentPage(page);
        if (newPageSize && newPageSize !== pageSize) {
            setPageSize(newPageSize);
        }
    };

    if (loading && !allData?.length) {
        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "400px",
                }}
            >
                <div>Loading products...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <h1>Manage Products</h1>
                <div style={{ color: "red", padding: "20px" }}>Error: {error}</div>
            </div>
        );
    }

    return (
        <div>
            <h1>Manage Products</h1>
            <CustomTable
                columns={columns}
                data={paginatedData}
                paginationTotal={paginationTotal}
                pageChange={pageChange}
                currentPage={currentPage}
                pageSize={pageSize}
            />

            <Modal
                title="Edit Product"
                open={isEditModalOpen}
                onCancel={handleCancelEdit}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmitEdit}
                >
                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: "Please input product name!" }]}
                    >
                        <Input placeholder="Product Name" />
                    </Form.Item>

                    <Form.Item
                        label="Product Image"
                        name="image"
                    >
                        <div>
                            <Upload
                                listType="picture-card"
                                fileList={fileList}
                                onChange={handleImageChange}
                                beforeUpload={beforeUpload}
                                onRemove={handleRemove}
                                maxCount={1}
                                accept="image/*"
                                showUploadList={{
                                    showPreviewIcon: false,
                                    showRemoveIcon: true,
                                }}
                                disabled={uploading}
                            >
                                {fileList.length < 1 && !uploading && (
                                    <div>
                                        <UploadOutlined style={{ fontSize: 24, color: "#999" }} />
                                        <div style={{ marginTop: 8, color: "#999" }}>
                                            Upload
                                        </div>
                                    </div>
                                )}
                                {uploading && (
                                    <div>
                                        <div style={{ marginTop: 8, color: "#999" }}>
                                            Uploading...
                                        </div>
                                    </div>
                                )}
                            </Upload>
                            
                            {previewUrl && (
                                <div style={{ marginTop: 16, textAlign: "center" }}>
                                    {fileList.length > 0 ? (
                                        <div style={{ marginBottom: 8, color: "#666" }}>
                                            Preview (new image)
                                        </div>
                                    ) : (
                                        <div style={{ marginBottom: 8, color: "#666" }}>
                                            Current Image:
                                        </div>
                                    )}
                                    <img
                                        src={previewUrl}
                                        alt="Product preview"
                                        style={{
                                            maxWidth: "100%",
                                            maxHeight: "200px",
                                            objectFit: "contain",
                                            border: "1px solid #d9d9d9",
                                            borderRadius: "4px",
                                            padding: "8px",
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = "none";
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        name="description"
                        rules={[{ required: true, message: "Please input description!" }]}
                    >
                        <TextArea rows={4} placeholder="Product Description" />
                    </Form.Item>

                    <Form.Item
                        label="Stems"
                        name="stems"
                        rules={[
                            { required: true, message: "Please input stems!" },
                            {
                                type: "number",
                                min: 1,
                                message: "Stems must be greater than 0!",
                            },
                        ]}
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            placeholder="12"
                            min={1}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Color"
                        name="color"
                        rules={[{ required: true, message: "Please input color!" }]}
                    >
                        <Input placeholder="Color" />
                    </Form.Item>

                    <Form.Item
                        label="Regular Price"
                        name="regularPrice"
                        rules={[
                            { required: true, message: "Please input regular price!" },
                            {
                                type: "number",
                                min: 0,
                                message: "Price must be greater than 0!",
                            },
                        ]}
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            prefix="$"
                            placeholder="0.00"
                            min={0}
                            step={0.01}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Sale Price (Discounted Price)"
                        name="discountedPrice"
                        rules={[
                            {
                                type: "number",
                                min: 0,
                                message: "Price must be greater than 0!",
                            },
                        ]}
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            prefix="$"
                            placeholder="0.00"
                            min={0}
                            step={0.01}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Stock (Quantity)"
                        name="quantity"
                        rules={[
                            { required: true, message: "Please input quantity!" },
                            {
                                type: "number",
                                min: 0,
                                message: "Quantity must be greater than or equal to 0!",
                            },
                        ]}
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            placeholder="0"
                            min={0}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Category"
                        name="category"
                        rules={[{ required: true, message: "Please input category!" }]}
                    >
                        <Input placeholder="Category" />
                    </Form.Item>

                    <Form.Item
                        label="Popularity"
                        name="popularity"
                        rules={[
                            {
                                type: "number",
                                min: 0,
                                max: 5,
                                message: "Popularity must be between 0 and 5!",
                            },
                        ]}
                    >
                        <InputNumber
                            style={{ width: "100%" }}
                            placeholder="3"
                            min={0}
                            max={5}
                        />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "8px",
                            }}
                        >
                            <Button onClick={handleCancelEdit} disabled={uploading}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading || uploading}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

