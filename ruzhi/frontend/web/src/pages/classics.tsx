import { useState } from 'react';
import { 
  Layout, 
  Typography, 
  Card, 
  Menu, 
  List, 
  Tabs,
  Space
} from 'antd';
import { 
  BookOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import AppLayout from '@/components/AppLayout';

const { Title, Paragraph, Text } = Typography;
const { Sider } = Layout;
const { TabPane } = Tabs;

interface ChapterData {
  id: string;
  title: string;
  content: string;
}

interface BookData {
  title: string;
  chapters: ChapterData[];
}

interface ClassicsDataType {
  [key: string]: BookData;
}

interface AnnotationItem {
  term: string;
  explanation: string;
}

// 模拟经典数据
const classicsData: ClassicsDataType = {
  analects: {
    title: '论语',
    chapters: [
      { id: 'xue-er', title: '学而第一', content: '子曰："学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？"' },
      { id: 'wei-zheng', title: '为政第二', content: '子曰："为政以德，譬如北辰，居其所而众星共之。"' },
      { id: 'ba-yi', title: '八佾第三', content: '孔子谓季氏："八佾舞于庭，是可忍也，孰不可忍也？"' }
    ]
  },
  mencius: {
    title: '孟子',
    chapters: [
      { id: 'liang-hui-wang', title: '梁惠王章句上', content: '孟子见梁惠王。王曰："叟！不远千里而来，亦将有以利吾国乎？"孟子对曰："王何必曰利？亦有仁义而已矣。"' },
      { id: 'gong-sun-chou', title: '公孙丑章句上', content: '公孙丑问曰："夫子当路于齐，管仲、晏婴之功，可复许乎？"' },
      { id: 'teng-wen-gong', title: '滕文公章句上', content: '滕文公为世子，将之楚，过宋而见孟子。孟子道性善，言必称尧舜。' }
    ]
  },
  doctrine: {
    title: '大学',
    chapters: [
      { id: 'classic', title: '经', content: '大学之道，在明明德，在亲民，在止于至善。' },
      { id: 'commentary', title: '传', content: '古之欲明明德于天下者，先治其国；欲治其国者，先齐其家；欲齐其家者，先修其身；欲修其身者，先正其心；欲正其心者，先诚其意；欲诚其意者，先致其知，致知在格物。' }
    ]
  }
};

export default function ClassicsLibrary() {
  const [selectedBook, setSelectedBook] = useState<string>('analects');
  const [selectedChapter, setSelectedChapter] = useState<string>('xue-er');
  const router = useRouter();

  const handleBookSelection = (key: string) => {
    setSelectedBook(key);
    // 选择书籍时默认选中第一章
    if (classicsData[key]?.chapters.length > 0) {
      setSelectedChapter(classicsData[key].chapters[0].id);
    }
  };

  const handleChapterSelection = (key: string) => {
    setSelectedChapter(key);
  };

  const getSelectedChapterContent = () => {
    const book = classicsData[selectedBook];
    if (!book) return null;
    
    const chapter = book.chapters.find(ch => ch.id === selectedChapter);
    if (!chapter) return null;
    
    return (
      <div className="chapter-content">
        <Card className="chapter-card">
          <Title level={3}>{book.title} · {chapter.title}</Title>
          <Paragraph className="ancient-text">
            {chapter.content}
          </Paragraph>
        </Card>

        <Card className="annotation-card" style={{ marginTop: 20 }}>
          <Tabs defaultActiveKey="translation">
            <TabPane tab="今译" key="translation">
              <Paragraph>
                {selectedBook === 'analects' && selectedChapter === 'xue-er' ? 
                  '孔子说："学习并且经常温习它，不也是很愉快的吗？有志同道合的朋友从远方来，不也是很快乐的吗？别人不了解自己却不气恼，不也是君子的品格吗？"' : 
                  '（此处显示今译内容）'}
              </Paragraph>
            </TabPane>
            <TabPane tab="注释" key="notes">
              <List
                size="small"
                bordered
                dataSource={[
                  { term: '学而时习之', explanation: '学：学习；而：连词，表并列；时：适时，经常；习：温习，复习；之：代词，指代所学内容。' },
                  { term: '说(悦)', explanation: '高兴，愉快。' },
                  { term: '有朋自远方来', explanation: '朋：志同道合的朋友；自：从；远方：遥远的地方。' },
                  { term: '不亦乐乎', explanation: '不：岂不；亦：也；乐：快乐；乎：语气词。' },
                  { term: '人不知而不愠', explanation: '不知：不了解，不理解；而：然而；愠：生气，怨恨。' }
                ]}
                renderItem={(item: AnnotationItem) => (
                  <List.Item>
                    <Space direction="vertical">
                      <Text strong>{item.term}</Text>
                      <Text>{item.explanation}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </TabPane>
            <TabPane tab="解读" key="interpretation">
              <Paragraph>
                {selectedBook === 'analects' && selectedChapter === 'xue-er' ? 
                  '本章是《论语》的开篇，表达了孔子对学习的态度和理想人格的追求。他强调了学习的快乐、友谊的珍贵和宽容的品格，体现了儒家思想中"乐学"、"亲仁"和"修己"的核心理念。' : 
                  '（此处显示深度解读内容）'}
              </Paragraph>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    );
  };

  return (
    <AppLayout
      title="经典库"
      description="儒智APP - 浏览儒家经典著作"
      selectedKey="classics"
      breadcrumbs={[
        { title: '经典库' },
        { title: classicsData[selectedBook]?.title }
      ]}
    >
      <Layout className="classics-layout" style={{ background: '#fff', padding: '24px 0', borderRadius: '8px' }}>
        <Sider width={200} theme="light" style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedBook]}
            style={{ height: '100%' }}
            onClick={({ key }: { key: string }) => handleBookSelection(key)}
            items={[
              {
                key: 'analects',
                icon: <BookOutlined />,
                label: '论语',
              },
              {
                key: 'mencius',
                icon: <BookOutlined />,
                label: '孟子',
              },
              {
                key: 'doctrine',
                icon: <BookOutlined />,
                label: '大学',
              },
              {
                key: 'mean',
                icon: <BookOutlined />,
                label: '中庸',
              }
            ]}
          />
        </Sider>
        <Layout style={{ padding: '0 24px 24px', background: '#fff' }}>
          <div style={{ display: 'flex', marginBottom: '20px' }}>
            <Menu
              mode="horizontal"
              selectedKeys={[selectedChapter]}
              onClick={({ key }: { key: string }) => handleChapterSelection(key)}
              style={{ flex: 1 }}
              items={
                classicsData[selectedBook]?.chapters.map(chapter => ({
                  key: chapter.id,
                  label: chapter.title,
                })) || []
              }
            />
          </div>
          {getSelectedChapterContent()}
        </Layout>
      </Layout>
    </AppLayout>
  );
} 