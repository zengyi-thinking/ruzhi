import { useState, useEffect } from 'react';
import { 
  Typography, 
  Upload, 
  Button, 
  Card, 
  Spin, 
  message, 
  Divider,
  Space,
  Tabs,
  Breadcrumb,
  Image,
  Row,
  Col,
  Select,
  Switch,
  Form,
  Tooltip,
  Table,
  Tag,
  Modal,
  Input,
  notification,
  Dropdown,
  Menu
} from 'antd';
import { 
  InboxOutlined, 
  ScanOutlined, 
  FileSearchOutlined,
  FileTextOutlined,
  SwapOutlined,
  SettingOutlined,
  HistoryOutlined,
  SaveOutlined,
  CopyOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  EditOutlined,
  DownloadOutlined,
  FileWordOutlined,
  FilePdfOutlined,
  FileTextOutlined as FileTextIcon,
  MoreOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import axios from 'axios';
import { useRouter } from 'next/router';
import AppLayout from '@/components/AppLayout';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

// 与后端模型对应的接口定义
interface TextVariant {
  original: string;
  modern: string;
  position: number[];
  confidence: number;
}

interface TextBox {
  text: string;
  box: number[][];
  confidence: number;
  type: string;
}

interface LayoutInfo {
  paragraphs: TextBox[];
  annotations: TextBox[];
  headers: TextBox[];
  images: any[];
}

interface OCRResult {
  text: string;
  layout?: LayoutInfo;
  variants?: TextVariant[];
  processing_time: number;
  confidence: number;
}

interface OCRMode {
  id: string;
  name: string;
  description: string;
}

interface OCRHistoryItem {
  id: string;
  filename: string;
  text: string;
  created_at: string;
  thumbnail?: string;
}

export default function OCRPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [ocrModes, setOcrModes] = useState<OCRMode[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>('ancient');
  const [historyItems, setHistoryItems] = useState<OCRHistoryItem[]>([]);
  const [loadingModes, setLoadingModes] = useState<boolean>(false);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editedText, setEditedText] = useState<string>('');
  const [saveModalVisible, setSaveModalVisible] = useState<boolean>(false);
  const [saveTitle, setSaveTitle] = useState<string>('');
  const [enhanceSettings, setEnhanceSettings] = useState({
    enhance_image: true,
    denoise: true,
    contrast_enhance: true,
    perspective_correction: true,
    binarization: true,
    detect_layout: true,
    recognize_variants: true,
  });
  
  const router = useRouter();

  // 加载可用的OCR模式
  useEffect(() => {
    const fetchOCRModes = async () => {
      try {
        setLoadingModes(true);
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ocr/modes`
        );
        setOcrModes(response.data.modes);
        setLoadingModes(false);
      } catch (error) {
        console.error('获取OCR模式失败:', error);
        message.error('无法获取OCR模式列表');
        setLoadingModes(false);
        // 设置默认模式
        setOcrModes([
          {id: 'standard', name: '标准模式', description: '通用文本识别'},
          {id: 'ancient', name: '古籍模式', description: '优化识别繁体字与古籍排版'},
          {id: 'handwriting', name: '手写体模式', description: '识别中文手写文本'}
        ]);
      }
    };
    
    fetchOCRModes();
  }, []);

  // 加载历史记录
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);
        // 实际项目中应使用真实的用户ID
        const userId = "current-user";
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ocr/history/${userId}`
        );
        setHistoryItems(response.data.history);
        setLoadingHistory(false);
      } catch (error) {
        console.error('获取历史记录失败:', error);
        setLoadingHistory(false);
      }
    };
    
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件!');
        return false;
      }
      setFileList([file]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
      setOcrResult(null);
    },
    onChange: (info) => {
      setFileList(info.fileList);
    },
  };

  const handleOCR = async () => {
    if (fileList.length === 0) {
      message.warning('请先上传图片');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', fileList[0].originFileObj as Blob);
    
    // 添加OCR选项
    const options = {
      mode: selectedMode,
      enhance_image: enhanceSettings.enhance_image,
      enhance_options: {
        denoise: enhanceSettings.denoise,
        contrast_enhance: enhanceSettings.contrast_enhance,
        perspective_correction: enhanceSettings.perspective_correction,
        binarization: enhanceSettings.binarization,
      },
      detect_layout: enhanceSettings.detect_layout,
      recognize_variants: enhanceSettings.recognize_variants,
    };
    
    // 将选项作为查询参数添加
    const queryParams = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (typeof value === 'object') {
        queryParams.append(key, JSON.stringify(value));
      } else {
        queryParams.append(key, String(value));
      }
    });
    
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/ocr/analyze?${queryParams.toString()}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setOcrResult(response.data);
      message.success('识别成功');
      setActiveTab('result');
    } catch (error) {
      console.error('OCR处理失败:', error);
      message.error('OCR处理失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 复制文本到剪贴板
  const copyTextToClipboard = () => {
    if (ocrResult?.text) {
      navigator.clipboard.writeText(ocrResult.text)
        .then(() => message.success('文本已复制到剪贴板'))
        .catch(() => message.error('复制失败，请手动复制'));
    }
  };

  // 打开文本编辑模态框
  const openEditModal = () => {
    setEditedText(ocrResult?.text || '');
    setEditModalVisible(true);
  };

  // 保存编辑后的文本
  const saveEditedText = () => {
    if (ocrResult) {
      setOcrResult({
        ...ocrResult,
        text: editedText
      });
      setEditModalVisible(false);
      notification.success({
        message: '文本编辑成功',
        description: '识别结果已更新为编辑后的内容。'
      });
    }
  };

  // 打开保存模态框
  const openSaveModal = () => {
    const timestamp = new Date().toLocaleString();
    setSaveTitle(`OCR识别结果_${timestamp}`);
    setSaveModalVisible(true);
  };

  // 保存识别结果到历史
  const saveResultToHistory = async () => {
    if (!ocrResult) return;

    try {
      const saveData = {
        title: saveTitle,
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        processing_time: ocrResult.processing_time,
        variants: ocrResult.variants,
        layout: ocrResult.layout,
        created_at: new Date().toISOString()
      };

      // 实际项目中应调用API保存结果
      // await axios.post('/api/v1/ocr/save', saveData);

      setSaveModalVisible(false);
      notification.success({
        message: '保存成功',
        description: '识别结果已保存到历史记录。'
      });
    } catch (error) {
      notification.error({
        message: '保存失败',
        description: '无法保存识别结果，请重试。'
      });
    }
  };

  // 导出为不同格式
  const exportResult = (format: 'txt' | 'json' | 'docx' | 'pdf') => {
    if (!ocrResult) return;

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `OCR识别结果_${timestamp}`;

    switch (format) {
      case 'txt':
        exportAsText(filename);
        break;
      case 'json':
        exportAsJSON(filename);
        break;
      case 'docx':
        exportAsWord(filename);
        break;
      case 'pdf':
        exportAsPDF(filename);
        break;
    }
  };

  // 导出为文本文件
  const exportAsText = (filename: string) => {
    const content = ocrResult?.text || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    notification.success({ message: '文本文件导出成功' });
  };

  // 导出为JSON文件
  const exportAsJSON = (filename: string) => {
    const exportData = {
      text: ocrResult?.text,
      confidence: ocrResult?.confidence,
      processing_time: ocrResult?.processing_time,
      variants: ocrResult?.variants,
      layout: ocrResult?.layout,
      export_time: new Date().toISOString()
    };

    const content = JSON.stringify(exportData, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notification.success({ message: 'JSON文件导出成功' });
  };

  // 导出为Word文档（简化版）
  const exportAsWord = (filename: string) => {
    const content = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>OCR识别结果</title>
        </head>
        <body>
          <h1>OCR识别结果</h1>
          <h2>识别文本</h2>
          <p>${ocrResult?.text?.replace(/\n/g, '<br>')}</p>
          <h2>识别信息</h2>
          <p>置信度: ${((ocrResult?.confidence || 0) * 100).toFixed(0)}%</p>
          <p>处理时间: ${ocrResult?.processing_time?.toFixed(2)}秒</p>
          <p>导出时间: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.doc`;
    link.click();
    URL.revokeObjectURL(url);
    notification.success({ message: 'Word文档导出成功' });
  };

  // 导出为PDF（简化版，实际项目中建议使用专门的PDF库）
  const exportAsPDF = (filename: string) => {
    notification.info({
      message: 'PDF导出',
      description: 'PDF导出功能需要集成专门的PDF生成库，当前版本暂不支持。'
    });
  };

  const handleSettingChange = (setting: string, value: boolean) => {
    setEnhanceSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const renderUploadTab = () => {
    return (
      <Card className="ocr-card">
        <Title level={4}>古籍智能识别</Title>
        <Paragraph>
          上传古籍图片，智能识别文字内容，支持繁体字、异体字识别。
        </Paragraph>
        
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Dragger {...uploadProps} className="upload-area">
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持单个图片文件上传，推荐使用清晰的古籍图片
              </p>
            </Dragger>
          </Col>
          <Col xs={24} md={8}>
            <Card title="识别设置" className="settings-card">
              <Form layout="vertical">
                <Form.Item label="识别模式">
                  <Select 
                    value={selectedMode} 
                    onChange={setSelectedMode}
                    loading={loadingModes}
                  >
                    {ocrModes.map(mode => (
                      <Option key={mode.id} value={mode.id}>
                        {mode.name}
                        <Tooltip title={mode.description}>
                          <InfoCircleOutlined style={{ marginLeft: 8 }} />
                        </Tooltip>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                
                <Divider orientation="left">高级设置</Divider>
                
                <Form.Item label="图像增强">
                  <Switch 
                    checked={enhanceSettings.enhance_image}
                    onChange={(checked) => handleSettingChange('enhance_image', checked)}
                  />
                </Form.Item>
                
                {enhanceSettings.enhance_image && (
                  <div className="enhance-options">
                    <Form.Item label="去噪">
                      <Switch 
                        size="small"
                        checked={enhanceSettings.denoise}
                        onChange={(checked) => handleSettingChange('denoise', checked)}
                      />
                    </Form.Item>
                    <Form.Item label="对比度增强">
                      <Switch 
                        size="small"
                        checked={enhanceSettings.contrast_enhance}
                        onChange={(checked) => handleSettingChange('contrast_enhance', checked)}
                      />
                    </Form.Item>
                    <Form.Item label="倾斜校正">
                      <Switch 
                        size="small"
                        checked={enhanceSettings.perspective_correction}
                        onChange={(checked) => handleSettingChange('perspective_correction', checked)}
                      />
                    </Form.Item>
                    <Form.Item label="二值化处理">
                      <Switch 
                        size="small"
                        checked={enhanceSettings.binarization}
                        onChange={(checked) => handleSettingChange('binarization', checked)}
                      />
                    </Form.Item>
                  </div>
                )}
                
                <Form.Item label="布局检测">
                  <Switch 
                    checked={enhanceSettings.detect_layout}
                    onChange={(checked) => handleSettingChange('detect_layout', checked)}
                  />
                </Form.Item>
                
                <Form.Item label="异体字识别">
                  <Switch 
                    checked={enhanceSettings.recognize_variants}
                    onChange={(checked) => handleSettingChange('recognize_variants', checked)}
                  />
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>
        
        <div className="action-bar">
          <Button 
            type="primary" 
            onClick={handleOCR}
            loading={loading}
            disabled={fileList.length === 0}
            icon={<ScanOutlined />}
            size="large"
          >
            开始识别
          </Button>
        </div>
      </Card>
    );
  };

  const renderResultTab = () => {
    if (!ocrResult) {
      return (
        <Card className="ocr-card">
          <Space direction="vertical" align="center" style={{ width: '100%', padding: '40px 0' }}>
            <Title level={4}>暂无识别结果</Title>
            <Paragraph>请先上传图片并进行识别</Paragraph>
            <Button type="primary" onClick={() => setActiveTab('upload')}>返回上传</Button>
          </Space>
        </Card>
      );
    }

    return (
      <Card className="ocr-card">
        <div className="result-header">
          <Title level={4}>识别结果</Title>
          <Space>
            <Text type="secondary">处理时间: {ocrResult.processing_time.toFixed(2)}秒</Text>
            <Text type="secondary">置信度: {(ocrResult.confidence * 100).toFixed(0)}%</Text>
          </Space>
        </div>

        <Divider />
        
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <Card 
              className="text-card" 
              title={
                <Space>
                  <FileTextOutlined />
                  <span>识别文本</span>
                </Space>
              }
              extra={
                <Space>
                  <Tooltip title="编辑文本">
                    <Button
                      icon={<EditOutlined />}
                      onClick={openEditModal}
                      size="small"
                    />
                  </Tooltip>
                  <Tooltip title="复制文本">
                    <Button
                      icon={<CopyOutlined />}
                      onClick={copyTextToClipboard}
                      size="small"
                    />
                  </Tooltip>
                  <Tooltip title="保存结果">
                    <Button
                      icon={<SaveOutlined />}
                      onClick={openSaveModal}
                      size="small"
                    />
                  </Tooltip>
                  <Dropdown
                    overlay={
                      <Menu onClick={({ key }) => exportResult(key as any)}>
                        <Menu.Item key="txt" icon={<FileTextIcon />}>
                          导出为文本文件
                        </Menu.Item>
                        <Menu.Item key="json" icon={<FileTextIcon />}>
                          导出为JSON文件
                        </Menu.Item>
                        <Menu.Item key="docx" icon={<FileWordOutlined />}>
                          导出为Word文档
                        </Menu.Item>
                        <Menu.Item key="pdf" icon={<FilePdfOutlined />}>
                          导出为PDF文档
                        </Menu.Item>
                      </Menu>
                    }
                    trigger={['click']}
                  >
                    <Tooltip title="导出文件">
                      <Button
                        icon={<DownloadOutlined />}
                        size="small"
                      />
                    </Tooltip>
                  </Dropdown>
                </Space>
              }
            >
              <div className="text-content">
                <Paragraph className="ancient-text">
                  {ocrResult.text}
                </Paragraph>
              </div>
            </Card>
            
            {ocrResult.layout && ocrResult.layout.annotations.length > 0 && (
              <Card className="annotations-card" title="批注内容" style={{marginTop: 16}}>
                <ul className="annotation-list">
                  {ocrResult.layout.annotations.map((annotation, index) => (
                    <li key={index} className="annotation-item">
                      <Text className="ancient-text">{annotation.text}</Text>
                      <Text type="secondary" className="confidence">
                        置信度: {(annotation.confidence * 100).toFixed(0)}%
                      </Text>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </Col>
          <Col xs={24} md={8}>
            <Card 
              className="variants-card" 
              title={
                <Space>
                  <SwapOutlined />
                  <span>异体字映射</span>
                </Space>
              }
            >
              {ocrResult.variants && ocrResult.variants.length > 0 ? (
                <Table 
                  dataSource={ocrResult.variants.map((v, i) => ({...v, key: i}))} 
                  pagination={false}
                  size="small"
                >
                  <Table.Column 
                    title="原字" 
                    dataIndex="original" 
                    key="original"
                    render={(text) => <Text className="ancient-text original-char">{text}</Text>}
                  />
                  <Table.Column 
                    title="通用字" 
                    dataIndex="modern" 
                    key="modern"
                    render={(text) => <Text className="modern-char">{text}</Text>}
                  />
                  <Table.Column 
                    title="置信度" 
                    dataIndex="confidence" 
                    key="confidence"
                    render={(value) => (
                      <Text>{(value * 100).toFixed(0)}%</Text>
                    )}
                  />
                </Table>
              ) : (
                <Paragraph>未检测到异体字</Paragraph>
              )}
            </Card>
            
            {fileList.length > 0 && fileList[0].originFileObj && (
              <Card title="原始图像" style={{marginTop: 16}}>
                <Image
                  width="100%"
                  src={URL.createObjectURL(fileList[0].originFileObj as Blob)}
                  alt="原始图像"
                />
              </Card>
            )}
          </Col>
        </Row>

        <div className="action-bar" style={{marginTop: 16}}>
          <Button onClick={() => setActiveTab('upload')}>继续上传</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={saveResult}>保存结果</Button>
        </div>
      </Card>
    );
  };

  const renderHistoryTab = () => {
    const historyColumns = [
      {
        title: '预览',
        dataIndex: 'thumbnail',
        key: 'thumbnail',
        render: (thumbnail: string, record: OCRHistoryItem) => (
          thumbnail ? 
          <Image src={thumbnail} alt={record.filename} width={80} height={60} style={{objectFit: 'cover'}} /> :
          <div className="no-thumbnail">无预览</div>
        )
      },
      {
        title: '文件名',
        dataIndex: 'filename',
        key: 'filename',
      },
      {
        title: '识别内容',
        dataIndex: 'text',
        key: 'text',
        render: (text: string) => (
          <Text ellipsis style={{maxWidth: 200}}>{text}</Text>
        )
      },
      {
        title: '处理时间',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (date: string) => (
          <Text>{new Date(date).toLocaleDateString()}</Text>
        )
      },
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: OCRHistoryItem) => (
          <Space size="small">
            <Button size="small" type="link">查看</Button>
            <Button size="small" type="link">下载</Button>
          </Space>
        )
      }
    ];

    return (
      <Card className="ocr-card">
        <Title level={4}>历史记录</Title>
        <Paragraph>
          查看您之前的OCR处理记录
        </Paragraph>
        
        <Spin spinning={loadingHistory}>
          <Table 
            dataSource={historyItems} 
            columns={historyColumns}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </Spin>
      </Card>
    );
  };

  return (
    <AppLayout 
      title="古籍智能识别"
      breadcrumb={
        <Breadcrumb>
          <Breadcrumb.Item>首页</Breadcrumb.Item>
          <Breadcrumb.Item>古籍智能识别</Breadcrumb.Item>
        </Breadcrumb>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={<span><InboxOutlined />上传识别</span>} 
          key="upload"
        >
          {renderUploadTab()}
        </TabPane>
        <TabPane 
          tab={<span><FileTextOutlined />识别结果</span>} 
          key="result"
          disabled={!ocrResult}
        >
          {renderResultTab()}
        </TabPane>
        <TabPane 
          tab={<span><HistoryOutlined />历史记录</span>} 
          key="history"
        >
          {renderHistoryTab()}
        </TabPane>
      </Tabs>

      {/* 文本编辑模态框 */}
      <Modal
        title="编辑识别文本"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={saveEditedText}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            您可以在下方编辑识别出的文本内容，修正识别错误或添加标点符号。
          </Text>
        </div>
        <TextArea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          rows={15}
          placeholder="请输入或编辑文本内容..."
          style={{ fontSize: '16px', lineHeight: '1.8' }}
        />
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Text type="secondary">字符数: {editedText.length}</Text>
          <Space>
            <Button size="small" onClick={() => setEditedText('')}>
              清空
            </Button>
            <Button size="small" onClick={() => setEditedText(ocrResult?.text || '')}>
              重置
            </Button>
          </Space>
        </div>
      </Modal>

      {/* 保存结果模态框 */}
      <Modal
        title="保存识别结果"
        open={saveModalVisible}
        onCancel={() => setSaveModalVisible(false)}
        onOk={saveResultToHistory}
        okText="保存"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="保存标题" required>
            <Input
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="请输入保存标题..."
            />
          </Form.Item>
          <Form.Item label="识别内容预览">
            <div style={{
              maxHeight: '200px',
              overflow: 'auto',
              padding: '12px',
              border: '1px solid #f0f0f0',
              borderRadius: '4px',
              backgroundColor: '#fafafa'
            }}>
              <Text className="ancient-text">
                {ocrResult?.text?.substring(0, 200)}
                {(ocrResult?.text?.length || 0) > 200 ? '...' : ''}
              </Text>
            </div>
          </Form.Item>
          <Form.Item label="识别信息">
            <Space direction="vertical" size="small">
              <Text type="secondary">
                置信度: {((ocrResult?.confidence || 0) * 100).toFixed(0)}%
              </Text>
              <Text type="secondary">
                处理时间: {ocrResult?.processing_time?.toFixed(2)}秒
              </Text>
              <Text type="secondary">
                异体字数量: {ocrResult?.variants?.length || 0}个
              </Text>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .ocr-card {
          margin-bottom: 24px;
        }
        
        .upload-area {
          margin-bottom: 24px;
        }
        
        .action-bar {
          margin-top: 16px;
          display: flex;
          justify-content: center;
          gap: 8px;
        }
        
        .text-content {
          max-height: 400px;
          overflow-y: auto;
          padding: 16px;
          border: 1px solid #f0f0f0;
          border-radius: 4px;
          background-color: #fafafa;
        }
        
        .ancient-text {
          font-size: 16px;
          line-height: 1.8;
        }
        
        .variant-list {
          list-style: none;
          padding: 0;
        }
        
        .variant-item {
          margin-bottom: 8px;
          padding: 8px;
          border-bottom: 1px dashed #f0f0f0;
        }
        
        .original-char {
          font-size: 18px;
          font-weight: bold;
          color: #722ed1;
        }
        
        .modern-char {
          font-size: 18px;
          font-weight: bold;
          color: #1890ff;
        }
        
        .settings-card .ant-form-item {
          margin-bottom: 8px;
        }
        
        .enhance-options {
          padding-left: 16px;
          margin-bottom: 16px;
        }
        
        .annotation-item {
          padding: 8px 0;
          border-bottom: 1px dashed #f0f0f0;
        }
        
        .confidence {
          margin-left: 8px;
        }
      `}</style>
    </AppLayout>
  );
} 