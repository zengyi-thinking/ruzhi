"""
儒智知识图谱服务 - 数据模型
定义知识图谱实体与关系的数据结构
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime


class NodeType(str, Enum):
    """节点类型枚举"""
    CONCEPT = "concept"           # 概念
    PERSON = "person"             # 人物
    PASSAGE = "passage"           # 文本段落
    BOOK = "book"                 # 书籍
    EVENT = "event"               # 历史事件
    LOCATION = "location"         # 地点
    QUOTE = "quote"               # 引言
    VIRTUE = "virtue"             # 德行/价值观
    TIME_PERIOD = "time_period"   # 时间段


class RelationType(str, Enum):
    """关系类型枚举"""
    IS_A = "is_a"                     # 是一种
    PART_OF = "part_of"               # 是...的一部分
    RELATED_TO = "related_to"         # 相关于
    MENTIONED_IN = "mentioned_in"     # 在...中被提及
    WROTE = "wrote"                   # 撰写了
    TEACHES_ABOUT = "teaches_about"   # 教导关于
    CONTRADICTS = "contradicts"       # 与...矛盾
    COMPLEMENTS = "complements"       # 与...互补
    HAPPENED_IN = "happened_in"       # 发生于
    INFLUENCED = "influenced"         # 影响了
    PRACTITIONER_OF = "practitioner_of" # ...的实践者
    STUDENT_OF = "student_of"         # ...的学生
    TEACHER_OF = "teacher_of"         # ...的老师
    ORIGINATED_FROM = "originated_from" # 起源于


class NodeBase(BaseModel):
    """节点基础数据结构"""
    id: Optional[str] = Field(None, description="节点ID")
    name: str = Field(..., description="节点名称")
    type: NodeType = Field(..., description="节点类型")


class ConceptNode(NodeBase):
    """概念节点"""
    type: NodeType = Field(default=NodeType.CONCEPT, description="节点类型")
    definition: str = Field(..., description="概念定义")
    first_appearance: Optional[str] = Field(None, description="首次出现")
    importance: Optional[float] = Field(None, description="重要性评分", ge=0.0, le=1.0)
    alternative_names: List[str] = Field(default_factory=list, description="别名")


class PersonNode(NodeBase):
    """人物节点"""
    type: NodeType = Field(default=NodeType.PERSON, description="节点类型")
    birth_year: Optional[int] = Field(None, description="出生年份")
    death_year: Optional[int] = Field(None, description="逝世年份")
    biography: Optional[str] = Field(None, description="简要传记")
    achievements: List[str] = Field(default_factory=list, description="成就")
    titles: List[str] = Field(default_factory=list, description="头衔/称号")


class PassageNode(NodeBase):
    """文本段落节点"""
    type: NodeType = Field(default=NodeType.PASSAGE, description="节点类型")
    content: str = Field(..., description="段落内容")
    book: str = Field(..., description="所属书籍")
    chapter: Optional[str] = Field(None, description="章节")
    commentary: Optional[str] = Field(None, description="注释")
    translation: Optional[str] = Field(None, description="译文")


class RelationBase(BaseModel):
    """关系基础数据结构"""
    source_id: str = Field(..., description="源节点ID")
    target_id: str = Field(..., description="目标节点ID")
    type: RelationType = Field(..., description="关系类型")
    strength: float = Field(default=0.5, description="关系强度", ge=0.0, le=1.0)
    description: Optional[str] = Field(None, description="关系描述")


class RelatedConcept(BaseModel):
    """相关概念信息"""
    name: str = Field(..., description="概念名称")
    relation: str = Field(..., description="关系类型")
    strength: float = Field(..., description="关系强度", ge=0.0, le=1.0)
    description: Optional[str] = Field(None, description="关系描述")


class ConceptOrigin(BaseModel):
    """概念出处信息"""
    text: str = Field(..., description="出处文本")
    passage: str = Field(..., description="段落内容")
    book: str = Field(..., description="书籍")
    chapter: Optional[str] = Field(None, description="章节")


class HistoricalEvent(BaseModel):
    """历史事件信息"""
    name: str = Field(..., description="事件名称")
    date: Optional[str] = Field(None, description="日期")
    description: str = Field(..., description="事件描述")
    related_people: List[str] = Field(default_factory=list, description="相关人物")


class ConceptResponse(BaseModel):
    """概念详情响应"""
    id: str = Field(..., description="概念ID")
    name: str = Field(..., description="概念名称")
    definition: str = Field(..., description="概念定义")
    alternative_names: List[str] = Field(default_factory=list, description="别名")
    origins: List[ConceptOrigin] = Field(default_factory=list, description="概念出处")
    related_concepts: List[RelatedConcept] = Field(default_factory=list, description="相关概念")
    historical_events: List[HistoricalEvent] = Field(default_factory=list, description="相关历史事件")
    importance: float = Field(default=0.5, description="重要性评分", ge=0.0, le=1.0)


class GraphNodeResponse(BaseModel):
    """图谱节点响应"""
    id: str = Field(..., description="节点ID")
    name: str = Field(..., description="节点名称")
    type: str = Field(..., description="节点类型")
    properties: Dict[str, Any] = Field(default_factory=dict, description="节点属性")


class GraphRelationResponse(BaseModel):
    """图谱关系响应"""
    source: str = Field(..., description="源节点ID")
    target: str = Field(..., description="目标节点ID")
    type: str = Field(..., description="关系类型")
    properties: Dict[str, Any] = Field(default_factory=dict, description="关系属性")


class GraphDataResponse(BaseModel):
    """图谱数据响应"""
    nodes: List[GraphNodeResponse] = Field(..., description="节点列表")
    relationships: List[GraphRelationResponse] = Field(..., description="关系列表")


class QueryResponse(BaseModel):
    """自然语言查询响应"""
    answer: str = Field(..., description="回答内容")
    source_passages: List[Dict[str, Any]] = Field(default_factory=list, description="来源段落")
    related_concepts: List[Dict[str, str]] = Field(default_factory=list, description="相关概念")


class GraphSearch(BaseModel):
    """图谱搜索请求"""
    query: str = Field(..., description="搜索关键词")
    node_types: Optional[List[NodeType]] = Field(None, description="节点类型过滤")
    limit: int = Field(default=20, description="返回结果数量上限")


class GraphExpand(BaseModel):
    """图谱扩展请求"""
    node_id: str = Field(..., description="需要扩展的节点ID")
    relation_types: Optional[List[RelationType]] = Field(None, description="关系类型过滤")
    depth: int = Field(default=1, description="扩展深度")
    limit: int = Field(default=10, description="每种关系的节点数量上限")


class PathFindRequest(BaseModel):
    """路径查找请求"""
    source_id: str = Field(..., description="源节点ID")
    target_id: str = Field(..., description="目标节点ID")
    max_depth: int = Field(default=4, description="最大深度")
    relation_types: Optional[List[RelationType]] = Field(None, description="关系类型过滤") 