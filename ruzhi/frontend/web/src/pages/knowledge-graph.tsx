import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, TextField, Button, Card, CardContent,
  Tabs, Tab, CircularProgress, List, ListItem, ListItemText,
  Divider, Chip, Paper, Grid, Accordion, AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ForceGraph2D from 'react-force-graph-2d';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import BookIcon from '@mui/icons-material/Book';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import InfoIcon from '@mui/icons-material/Info';

// 类型定义
interface Concept {
  id: string;
  name: string;
  definition: string;
  importance?: number;
}

interface ConceptDetail {
  id: string;
  name: string;
  definition: string;
  alternative_names: string[];
  origins: {
    text: string;
    passage: string;
    book: string;
    chapter?: string;
  }[];
  related_concepts: {
    name: string;
    relation: string;
    strength: number;
    description?: string;
  }[];
  historical_events: {
    name: string;
    date?: string;
    description: string;
    related_people: string[];
  }[];
  importance: number;
}

interface GraphNode {
  id: string;
  name: string;
  type: string;
  properties: Record<string, any>;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  properties: Record<string, any>;
}

interface GraphData {
  nodes: GraphNode[];
  relationships: GraphLink[];
}

interface QueryResult {
  answer: string;
  source_passages: {
    source: string;
    content: string;
  }[];
  related_concepts: {
    name: string;
    relation: string;
  }[];
}

// API服务基础URL
const API_BASE_URL = '/api/v1/knowledge';

const KnowledgeGraphPage: React.FC = () => {
  // 状态定义
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredConcepts, setFeaturedConcepts] = useState<Concept[]>([]);
  const [searchResults, setSearchResults] = useState<Concept[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState(0);
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [selectedConcept, setSelectedConcept] = useState<ConceptDetail | null>(null);
  const [queryInput, setQueryInput] = useState<string>('');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  
  // 获取推荐概念
  useEffect(() => {
    fetchFeaturedConcepts();
  }, []);
  
  const fetchFeaturedConcepts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/featured_concepts`);
      if (response.ok) {
        const data = await response.json();
        setFeaturedConcepts(data.featured);
      } else {
        console.error('获取推荐概念失败');
      }
    } catch (error) {
      console.error('获取推荐概念错误:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 搜索节点
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: searchQuery,
          node_types: [],
          limit: 10
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.nodes);
      } else {
        console.error('搜索失败');
      }
    } catch (error) {
      console.error('搜索错误:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 获取概念详情
  const fetchConceptDetail = async (conceptId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/concept/${conceptId}`);
      
      if (response.ok) {
        const data = await response.json();
        setSelectedConcept(data);
        // 更新图谱
        await expandNodeInGraph(conceptId);
      } else {
        console.error('获取概念详情失败');
      }
    } catch (error) {
      console.error('获取概念详情错误:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 扩展节点关系
  const expandNodeInGraph = async (nodeId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/expand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          node_id: nodeId,
          depth: 1,
          limit: 10
        })
      });
      
      if (response.ok) {
        const data: GraphData = await response.json();
        
        // 转换为力导向图所需格式
        const nodes = data.nodes.map(node => ({
          id: node.id,
          name: node.name,
          type: node.type,
          ...node.properties
        }));
        
        const links = data.relationships.map(rel => ({
          source: rel.source,
          target: rel.target,
          type: rel.type,
          ...rel.properties
        }));
        
        setGraphData({ nodes, links });
      } else {
        console.error('扩展节点失败');
      }
    } catch (error) {
      console.error('扩展节点错误:', error);
    }
  };
  
  // 自然语言查询
  const handleQuery = async () => {
    if (!queryInput.trim()) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/query?q=${encodeURIComponent(queryInput)}`);
      
      if (response.ok) {
        const data = await response.json();
        setQueryResult(data);
      } else {
        console.error('查询失败');
      }
    } catch (error) {
      console.error('查询错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 标签页切换
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          国学知识图谱
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          探索中国传统文化的概念关系，深入了解经典著作中的智慧。
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab label="概念搜索" icon={<SearchIcon />} iconPosition="start" />
            <Tab label="图谱探索" icon={<BookIcon />} iconPosition="start" />
            <Tab label="智能问答" icon={<QuestionAnswerIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        
        {/* 概念搜索面板 */}
        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', mb: 3 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="输入关键词搜索概念..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSearch}
                sx={{ ml: 1 }}
              >
                搜索
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                {searchResults.length > 0 ? (
                  <Grid container spacing={2}>
                    {searchResults.map((result) => (
                      <Grid item xs={12} md={6} key={result.id}>
                        <Card 
                          onClick={() => fetchConceptDetail(result.id)}
                          sx={{ 
                            cursor: 'pointer',
                            transition: '0.2s',
                            '&:hover': { 
                              transform: 'translateY(-2px)',
                              boxShadow: 3 
                            }
                          }}
                        >
                          <CardContent>
                            <Typography variant="h6" component="div">
                              {result.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {result.definition || "无定义"}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      推荐概念
                    </Typography>
                    <Grid container spacing={2}>
                      {featuredConcepts.map((concept) => (
                        <Grid item xs={12} md={4} key={concept.id}>
                          <Card 
                            onClick={() => fetchConceptDetail(concept.id)}
                            sx={{ 
                              cursor: 'pointer',
                              transition: '0.2s',
                              '&:hover': { 
                                transform: 'translateY(-2px)',
                                boxShadow: 3 
                              }
                            }}
                          >
                            <CardContent>
                              <Typography variant="h6" component="div">
                                {concept.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {concept.definition}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}
            
            {/* 概念详情 */}
            {selectedConcept && (
              <Paper sx={{ mt: 4, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" component="h2">
                    {selectedConcept.name}
                  </Typography>
                  <Chip 
                    label={`重要性 ${Math.round(selectedConcept.importance * 100)}%`} 
                    color="primary" 
                    icon={<InfoIcon />} 
                  />
                </Box>
                
                <Typography variant="body1" paragraph>
                  {selectedConcept.definition}
                </Typography>
                
                {selectedConcept.alternative_names.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" component="h3" gutterBottom>
                      异名别称
                    </Typography>
                    <Box>
                      {selectedConcept.alternative_names.map((name, index) => (
                        <Chip 
                          key={index} 
                          label={name} 
                          size="small" 
                          sx={{ mr: 1, mb: 1 }} 
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>出处 ({selectedConcept.origins.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {selectedConcept.origins.map((origin, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="primary">
                          {origin.text}
                        </Typography>
                        <Typography variant="body2">
                          "{origin.passage}"
                        </Typography>
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>
                      相关概念 ({selectedConcept.related_concepts.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {selectedConcept.related_concepts.map((related, index) => (
                        <React.Fragment key={index}>
                          {index > 0 && <Divider />}
                          <ListItem>
                            <ListItemText 
                              primary={related.name} 
                              secondary={`关系: ${related.relation} | 强度: ${Math.round(related.strength * 100)}%${related.description ? ` | ${related.description}` : ''}`} 
                            />
                          </ListItem>
                        </React.Fragment>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
                
                {selectedConcept.historical_events.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography>
                        相关历史事件 ({selectedConcept.historical_events.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {selectedConcept.historical_events.map((event, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && <Divider />}
                            <ListItem>
                              <ListItemText 
                                primary={`${event.name}${event.date ? ` (${event.date})` : ''}`}
                                secondary={
                                  <>
                                    <Typography variant="body2">{event.description}</Typography>
                                    {event.related_people.length > 0 && (
                                      <Box sx={{ mt: 1 }}>
                                        {event.related_people.map((person, i) => (
                                          <Chip 
                                            key={i} 
                                            label={person} 
                                            size="small" 
                                            variant="outlined" 
                                            sx={{ mr: 0.5, mb: 0.5 }} 
                                          />
                                        ))}
                                      </Box>
                                    )}
                                  </>
                                }
                              />
                            </ListItem>
                          </React.Fragment>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Paper>
            )}
          </Box>
        )}
        
        {/* 图谱探索面板 */}
        {activeTab === 1 && (
          <Box>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="body1">
                选择一个概念以在图谱中查看其关系网络。点击节点可以进一步展开关系。
              </Typography>
            </Paper>
            
            <Box sx={{ 
              height: '70vh', 
              border: '1px solid #ddd', 
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: '#f5f5f5'
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '100%'
              }}>
                <Typography variant="h6" color="text.secondary">
                  请先选择一个概念以查看其关系网络
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* 智能问答面板 */}
        {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', mb: 3 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="请输入您想了解的儒家经典或概念问题..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleQuery}
                sx={{ ml: 1 }}
              >
                询问
              </Button>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : queryResult ? (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  回答
                </Typography>
                <Typography variant="body1" paragraph>
                  {queryResult.answer}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom>
                  参考出处
                </Typography>
                {queryResult.source_passages.map((source, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="primary">
                      {source.source}
                    </Typography>
                    <Typography variant="body2">
                      "{source.content.substring(0, 100)}..."
                    </Typography>
                  </Box>
                ))}
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    相关概念
                  </Typography>
                  <Box>
                    {queryResult.related_concepts.map((concept, index) => (
                      <Chip 
                        key={index} 
                        label={concept.name} 
                        variant="outlined" 
                        color="primary" 
                        sx={{ mr: 1, mb: 1 }} 
                      />
                    ))}
                  </Box>
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ p: 3 }}>
                <Typography variant="body1" color="text.secondary">
                  您可以询问关于儒家经典、思想家、核心概念的问题，例如：
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="孟子的仁义礼智是什么意思？" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="如何理解'民为贵，社稷次之，君为轻'？" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="子曰：'学而不思则罔，思而不学则殆'是什么意思？" />
                  </ListItem>
                </List>
              </Paper>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default KnowledgeGraphPage; 