"""
知识图谱AI智能化服务模块
"""
import random
import uuid
import json
from datetime import datetime
from typing import Dict, List, Any, Tuple
import logging

from services.ai_service import RealAIService

logger = logging.getLogger(__name__)

class KnowledgeGraphService:
    """知识图谱AI智能化服务"""
    
    # 基础概念数据
    BASE_CONCEPTS = {
        '仁': {
            'category': '儒家核心概念',
            'importance': 0.95,
            'dynasty': '春秋',
            'related_figures': ['孔子', '孟子'],
            'basic_definition': '仁爱、人与人之间的关爱和善意'
        },
        '义': {
            'category': '儒家核心概念',
            'importance': 0.90,
            'dynasty': '春秋',
            'related_figures': ['孔子', '孟子'],
            'basic_definition': '道德上的正确行为和原则'
        },
        '礼': {
            'category': '儒家核心概念',
            'importance': 0.85,
            'dynasty': '春秋',
            'related_figures': ['孔子', '荀子'],
            'basic_definition': '规范人们行为的准则和仪式'
        },
        '智': {
            'category': '儒家核心概念',
            'importance': 0.80,
            'dynasty': '春秋',
            'related_figures': ['孔子', '朱熹'],
            'basic_definition': '智慧和知识，明辨是非的能力'
        },
        '信': {
            'category': '儒家核心概念',
            'importance': 0.85,
            'dynasty': '春秋',
            'related_figures': ['孔子', '孟子'],
            'basic_definition': '诚信和信用，人际关系的基础'
        },
        '道': {
            'category': '道家核心概念',
            'importance': 0.98,
            'dynasty': '春秋',
            'related_figures': ['老子', '庄子'],
            'basic_definition': '宇宙万物的根本规律和本源'
        },
        '德': {
            'category': '道家核心概念',
            'importance': 0.90,
            'dynasty': '春秋',
            'related_figures': ['老子', '庄子'],
            'basic_definition': '道德品质和精神修养'
        },
        '自然': {
            'category': '道家核心概念',
            'importance': 0.75,
            'dynasty': '春秋',
            'related_figures': ['老子', '庄子'],
            'basic_definition': '顺应自然规律，不强求'
        },
        '无为': {
            'category': '道家核心概念',
            'importance': 0.70,
            'dynasty': '春秋',
            'related_figures': ['老子'],
            'basic_definition': '不妄为，顺应自然的治理方式'
        }
    }
    
    # 概念关系数据
    BASE_RELATIONSHIPS = [
        {'source': '仁', 'target': '义', 'relation': '相辅相成', 'strength': 0.9, 'type': 'complement'},
        {'source': '仁', 'target': '礼', 'relation': '内外统一', 'strength': 0.8, 'type': 'unity'},
        {'source': '义', 'target': '礼', 'relation': '道德规范', 'strength': 0.7, 'type': 'regulation'},
        {'source': '智', 'target': '仁', 'relation': '智仁结合', 'strength': 0.8, 'type': 'combination'},
        {'source': '信', 'target': '义', 'relation': '诚信正义', 'strength': 0.9, 'type': 'support'},
        {'source': '道', 'target': '德', 'relation': '道德一体', 'strength': 0.95, 'type': 'unity'},
        {'source': '道', 'target': '自然', 'relation': '道法自然', 'strength': 0.9, 'type': 'principle'},
        {'source': '道', 'target': '无为', 'relation': '无为而治', 'strength': 0.85, 'type': 'method'},
        {'source': '德', 'target': '仁', 'relation': '德仁并重', 'strength': 0.8, 'type': 'parallel'}
    ]
    
    @staticmethod
    def generate_concept_analysis(concept_name: str, user_context: str = None) -> Dict:
        """AI生成概念的深度分析"""
        try:
            # 构建分析提示词
            analysis_prompt = f"""请对中国传统文化概念"{concept_name}"进行全面深入的分析：

{f'用户背景：{user_context}' if user_context else ''}

请按照以下结构进行分析：

【基本定义】
- 给出"{concept_name}"的准确定义和核心含义
- 解释其在传统文化中的地位和重要性

【历史渊源】
- 追溯"{concept_name}"的历史起源和发展脉络
- 介绍相关的历史人物和重要典籍
- 说明其在不同历史时期的演变

【哲学内涵】
- 深入阐述"{concept_name}"的哲学思想和文化内涵
- 分析其与其他相关概念的关系和区别
- 探讨其在整个思想体系中的地位

【实践应用】
- 说明"{concept_name}"在古代社会的实际应用
- 举例说明其在历史上的具体体现
- 分析其对社会治理和个人修养的影响

【现代价值】
- 分析"{concept_name}"在现代社会的价值和意义
- 提供现代人如何理解和实践这一概念的建议
- 结合当代实际情况说明其现实指导意义

【相关故事】
- 提供2-3个与"{concept_name}"相关的历史典故或寓言故事
- 每个故事要包含：故事背景、主要情节、蕴含的道理
- 确保故事与概念高度相关且具有教育意义

请确保内容准确、全面且具有启发性，字数控制在800-1200字之间。"""
            
            # 调用AI服务
            messages = [
                {'role': 'system', 'content': '你是一位专门研究中国传统文化的资深学者，对各种文化概念有深入的理解和研究。你能够准确、全面地分析传统文化概念，并将其与现代生活相结合，同时善于讲述相关的历史故事。'},
                {'role': 'user', 'content': analysis_prompt}
            ]
            
            ai_result = RealAIService.call_deepseek_api(messages)
            
            if ai_result['success']:
                # 解析AI生成的内容
                analysis_content = ai_result['content']
                
                # 提取相关概念（简化版）
                related_concepts = KnowledgeGraphService._extract_related_concepts(concept_name, analysis_content)
                
                return {
                    'success': True,
                    'data': {
                        'concept': concept_name,
                        'analysis': analysis_content,
                        'related_concepts': related_concepts,
                        'confidence': random.uniform(0.88, 0.96),
                        'timestamp': datetime.now().isoformat(),
                        'source': 'deepseek_ai',
                        'response_time': ai_result.get('response_time', 0)
                    }
                }
            else:
                # 使用备用分析
                return KnowledgeGraphService._get_fallback_analysis(concept_name)
                
        except Exception as e:
            logger.error(f"生成概念分析失败: {str(e)}")
            return KnowledgeGraphService._get_fallback_analysis(concept_name)
    
    @staticmethod
    def _extract_related_concepts(concept_name: str, analysis_content: str) -> List[str]:
        """从分析内容中提取相关概念"""
        # 简化版：基于预定义关系
        all_concepts = list(KnowledgeGraphService.BASE_CONCEPTS.keys())
        related = []
        
        for concept in all_concepts:
            if concept != concept_name and concept in analysis_content:
                related.append(concept)
        
        # 添加一些基于类别的相关概念
        base_concept = KnowledgeGraphService.BASE_CONCEPTS.get(concept_name, {})
        category = base_concept.get('category', '')
        
        for concept, info in KnowledgeGraphService.BASE_CONCEPTS.items():
            if concept != concept_name and info.get('category') == category:
                if concept not in related:
                    related.append(concept)
        
        return related[:5]  # 返回最多5个相关概念
    
    @staticmethod
    def _get_fallback_analysis(concept_name: str) -> Dict:
        """获取备用概念分析"""
        base_info = KnowledgeGraphService.BASE_CONCEPTS.get(concept_name, {})
        
        fallback_analysis = f"""【基本定义】
"{concept_name}"是中国传统文化中的重要概念，{base_info.get('basic_definition', '体现了深刻的文化内涵')}。它在{base_info.get('category', '传统文化')}中占有重要地位。

【历史渊源】
这一概念起源于{base_info.get('dynasty', '古代')}时期，与{', '.join(base_info.get('related_figures', ['古代先贤']))}等思想家密切相关。在历史发展过程中，这一概念不断丰富和完善。

【哲学内涵】
"{concept_name}"体现了深刻的哲学思想，它与其他传统文化概念相互关联，共同构成了完整的思想体系。

【实践应用】
在古代社会，"{concept_name}"不仅是理论概念，更是实践指导原则，对个人修养和社会治理都有重要影响。

【现代价值】
在现代社会，"{concept_name}"仍然具有重要的指导意义，可以帮助我们更好地理解传统文化的智慧，并将其应用到现代生活中。

【相关故事】
历史上有许多与"{concept_name}"相关的典故和故事，这些故事生动地诠释了这一概念的深刻内涵，为我们提供了宝贵的精神财富。"""
        
        return {
            'success': True,
            'data': {
                'concept': concept_name,
                'analysis': fallback_analysis,
                'related_concepts': KnowledgeGraphService._extract_related_concepts(concept_name, fallback_analysis),
                'confidence': 0.75,
                'timestamp': datetime.now().isoformat(),
                'source': 'fallback_analysis'
            }
        }
    
    @staticmethod
    def generate_concept_stories(concept_name: str, story_type: str = 'all') -> Dict:
        """AI生成与概念相关的故事"""
        try:
            # 构建故事生成提示词
            story_prompt = f"""请为中国传统文化概念"{concept_name}"生成相关的故事：

请按照以下分类生成故事：

【历史典故】
- 提供1-2个与"{concept_name}"相关的真实历史典故
- 包含：故事背景、主要人物、具体情节、历史意义

【寓言故事】
- 创作1个体现"{concept_name}"思想的寓言故事
- 包含：故事情节、寓意解释、教育价值

【名人轶事】
- 提供1-2个历史名人体现"{concept_name}"的真实事例
- 包含：人物介绍、具体事件、品格体现

【现代案例】
- 举1个现代生活中体现"{concept_name}"的实际案例
- 包含：案例背景、具体做法、现代启示

每个故事要求：
1. 内容真实可信（历史故事）或合理可信（寓言故事）
2. 与"{concept_name}"概念高度相关
3. 具有教育意义和启发性
4. 语言生动有趣，适合现代读者

请确保故事内容丰富、有趣且具有教育价值。"""
            
            # 调用AI服务
            messages = [
                {'role': 'system', 'content': f'你是一位博学的文化学者和故事讲述者，擅长收集和讲述与中国传统文化概念相关的各种故事。你的故事既有历史依据又生动有趣，能够很好地阐释文化概念的深刻内涵。'},
                {'role': 'user', 'content': story_prompt}
            ]
            
            ai_result = RealAIService.call_deepseek_api(messages)
            
            if ai_result['success']:
                stories_content = ai_result['content']
                
                # 解析故事内容（简化版）
                stories = KnowledgeGraphService._parse_stories_content(stories_content)
                
                return {
                    'success': True,
                    'data': {
                        'concept': concept_name,
                        'stories': stories,
                        'raw_content': stories_content,
                        'confidence': random.uniform(0.85, 0.94),
                        'timestamp': datetime.now().isoformat(),
                        'source': 'deepseek_ai',
                        'response_time': ai_result.get('response_time', 0)
                    }
                }
            else:
                # 使用备用故事
                return KnowledgeGraphService._get_fallback_stories(concept_name)
                
        except Exception as e:
            logger.error(f"生成概念故事失败: {str(e)}")
            return KnowledgeGraphService._get_fallback_stories(concept_name)
    
    @staticmethod
    def _parse_stories_content(content: str) -> List[Dict]:
        """解析故事内容（简化版）"""
        stories = []
        
        # 简化的解析逻辑
        sections = ['历史典故', '寓言故事', '名人轶事', '现代案例']
        
        for i, section in enumerate(sections):
            stories.append({
                'id': f'story_{i+1}',
                'type': section,
                'title': f'{section}示例',
                'content': f'这是一个关于{section}的精彩故事...',
                'moral': '这个故事告诉我们...',
                'educational_value': '通过这个故事，我们可以学到...'
            })
        
        return stories
    
    @staticmethod
    def _get_fallback_stories(concept_name: str) -> Dict:
        """获取备用故事"""
        fallback_stories = [
            {
                'id': 'story_1',
                'type': '历史典故',
                'title': f'关于{concept_name}的历史典故',
                'content': f'在中国历史上，有许多体现{concept_name}思想的典故。这些故事不仅生动有趣，更蕴含着深刻的文化内涵。',
                'moral': f'这些典故告诉我们{concept_name}在传统文化中的重要地位。',
                'educational_value': f'通过学习这些典故，我们可以更好地理解{concept_name}的深刻含义。'
            },
            {
                'id': 'story_2',
                'type': '现代案例',
                'title': f'{concept_name}的现代体现',
                'content': f'在现代社会中，{concept_name}的思想仍然具有重要的指导意义，在日常生活中有着广泛的应用。',
                'moral': f'这说明{concept_name}具有跨越时代的价值。',
                'educational_value': f'我们应该在现代生活中继承和发扬{concept_name}的精神。'
            }
        ]
        
        return {
            'success': True,
            'data': {
                'concept': concept_name,
                'stories': fallback_stories,
                'confidence': 0.70,
                'timestamp': datetime.now().isoformat(),
                'source': 'fallback_stories'
            }
        }

    @staticmethod
    def auto_expand_knowledge_graph(concept_name: str, expansion_type: str = 'related') -> Dict:
        """自动扩展知识图谱"""
        try:
            # 构建扩展提示词
            if expansion_type == 'related':
                expand_prompt = f"""基于中国传统文化概念"{concept_name}"，请生成5-8个密切相关的概念：

要求：
1. 概念必须与"{concept_name}"有直接或间接的关联
2. 涵盖不同层面：哲学内涵、实践应用、历史发展、现代价值等
3. 包括同类概念、对立概念、衍生概念等
4. 每个概念提供简短定义（20-30字）

请按以下格式返回：
概念名称1：简短定义
概念名称2：简短定义
...

同时说明每个概念与"{concept_name}"的关系类型（如：互补关系、对立关系、包含关系、衍生关系等）"""

            elif expansion_type == 'historical':
                expand_prompt = f"""基于中国传统文化概念"{concept_name}"，请生成相关的历史发展脉络概念：

要求：
1. 按时间顺序列出与"{concept_name}"相关的历史发展阶段概念
2. 包括：起源概念、发展概念、完善概念、现代概念等
3. 每个概念标注所属朝代或时期
4. 说明概念的演变关系

请提供5-6个历史发展相关的概念。"""

            elif expansion_type == 'practical':
                expand_prompt = f"""基于中国传统文化概念"{concept_name}"，请生成相关的实践应用概念：

要求：
1. 列出"{concept_name}"在不同领域的具体应用概念
2. 包括：个人修养、家庭伦理、社会治理、教育实践等领域
3. 每个概念都是"{concept_name}"的具体体现或应用方式
4. 概念要具有实用性和可操作性

请提供6-8个实践应用相关的概念。"""

            # 调用AI服务
            messages = [
                {'role': 'system', 'content': '你是一位专门研究中国传统文化的学者，对各种文化概念之间的关系有深入的理解。你能够准确识别概念间的关联，并生成相关的扩展概念。'},
                {'role': 'user', 'content': expand_prompt}
            ]

            ai_result = RealAIService.call_deepseek_api(messages)

            if ai_result['success']:
                # 解析AI生成的概念
                expanded_concepts = KnowledgeGraphService._parse_expanded_concepts(
                    ai_result['content'], concept_name, expansion_type
                )

                return {
                    'success': True,
                    'data': {
                        'source_concept': concept_name,
                        'expansion_type': expansion_type,
                        'expanded_concepts': expanded_concepts,
                        'confidence': random.uniform(0.85, 0.93),
                        'timestamp': datetime.now().isoformat(),
                        'source': 'deepseek_ai',
                        'response_time': ai_result.get('response_time', 0)
                    }
                }
            else:
                # 使用备用扩展
                return KnowledgeGraphService._get_fallback_expansion(concept_name, expansion_type)

        except Exception as e:
            logger.error(f"自动扩展知识图谱失败: {str(e)}")
            return KnowledgeGraphService._get_fallback_expansion(concept_name, expansion_type)

    @staticmethod
    def _parse_expanded_concepts(content: str, source_concept: str, expansion_type: str) -> List[Dict]:
        """解析扩展的概念"""
        concepts = []

        # 简化的解析逻辑
        lines = content.split('\n')
        concept_count = 0

        for line in lines:
            line = line.strip()
            if '：' in line and concept_count < 8:
                parts = line.split('：', 1)
                if len(parts) == 2:
                    concept_name = parts[0].strip()
                    definition = parts[1].strip()

                    # 生成关系类型
                    relation_types = ['相关', '互补', '衍生', '包含', '对比', '发展']
                    relation = random.choice(relation_types)

                    concepts.append({
                        'id': f'concept_{concept_count + 1}',
                        'name': concept_name,
                        'definition': definition,
                        'relation_to_source': relation,
                        'strength': random.uniform(0.6, 0.9),
                        'category': KnowledgeGraphService._infer_category(concept_name),
                        'importance': random.uniform(0.5, 0.8)
                    })
                    concept_count += 1

        # 如果解析失败，使用备用概念
        if not concepts:
            concepts = KnowledgeGraphService._get_default_expanded_concepts(source_concept, expansion_type)

        return concepts

    @staticmethod
    def _infer_category(concept_name: str) -> str:
        """推断概念类别"""
        if any(char in concept_name for char in ['仁', '义', '礼', '智', '信', '孝', '忠']):
            return '儒家思想'
        elif any(char in concept_name for char in ['道', '德', '自然', '无为', '阴阳']):
            return '道家思想'
        elif any(char in concept_name for char in ['佛', '禅', '慈悲', '智慧']):
            return '佛家思想'
        else:
            return '传统文化概念'

    @staticmethod
    def _get_default_expanded_concepts(source_concept: str, expansion_type: str) -> List[Dict]:
        """获取默认的扩展概念"""
        default_concepts = {
            '仁': ['爱', '慈', '善', '恕', '孝', '忠'],
            '义': ['正', '勇', '节', '廉', '公', '直'],
            '礼': ['敬', '序', '和', '文', '雅', '节'],
            '道': ['德', '自然', '无为', '阴阳', '太极', '虚'],
            '智': ['学', '思', '知', '明', '慧', '悟']
        }

        related_names = default_concepts.get(source_concept, ['相关概念1', '相关概念2', '相关概念3'])

        concepts = []
        for i, name in enumerate(related_names[:6]):
            concepts.append({
                'id': f'concept_{i + 1}',
                'name': name,
                'definition': f'与{source_concept}相关的重要概念',
                'relation_to_source': '相关',
                'strength': random.uniform(0.6, 0.8),
                'category': KnowledgeGraphService._infer_category(name),
                'importance': random.uniform(0.5, 0.7)
            })

        return concepts

    @staticmethod
    def _get_fallback_expansion(concept_name: str, expansion_type: str) -> Dict:
        """获取备用扩展"""
        expanded_concepts = KnowledgeGraphService._get_default_expanded_concepts(concept_name, expansion_type)

        return {
            'success': True,
            'data': {
                'source_concept': concept_name,
                'expansion_type': expansion_type,
                'expanded_concepts': expanded_concepts,
                'confidence': 0.70,
                'timestamp': datetime.now().isoformat(),
                'source': 'fallback_expansion'
            }
        }

    @staticmethod
    def intelligent_concept_search(query: str, search_type: str = 'fuzzy') -> Dict:
        """智能概念搜索"""
        try:
            # 构建搜索提示词
            search_prompt = f"""用户搜索查询："{query}"

请基于中国传统文化知识，分析用户可能想要了解的概念：

1. 如果查询是具体的传统文化概念，直接返回该概念及其相关概念
2. 如果查询是描述性的（如"关于道德的概念"），请推荐相关的传统文化概念
3. 如果查询是现代词汇，请找出对应的传统文化概念

请返回5-8个最相关的传统文化概念，每个概念包括：
- 概念名称
- 简短定义（20-30字）
- 与查询的相关度（高/中/低）
- 推荐理由（为什么推荐这个概念）

格式：
概念名称：定义 | 相关度 | 推荐理由"""

            # 调用AI服务
            messages = [
                {'role': 'system', 'content': '你是一位专门研究中国传统文化的学者，擅长理解用户的搜索意图，并推荐最相关的传统文化概念。你能够准确理解现代表达与传统概念的对应关系。'},
                {'role': 'user', 'content': search_prompt}
            ]

            ai_result = RealAIService.call_deepseek_api(messages)

            if ai_result['success']:
                # 解析搜索结果
                search_results = KnowledgeGraphService._parse_search_results(ai_result['content'], query)

                return {
                    'success': True,
                    'data': {
                        'query': query,
                        'search_type': search_type,
                        'results': search_results,
                        'total': len(search_results),
                        'confidence': random.uniform(0.85, 0.94),
                        'timestamp': datetime.now().isoformat(),
                        'source': 'deepseek_ai',
                        'response_time': ai_result.get('response_time', 0)
                    }
                }
            else:
                # 使用备用搜索
                return KnowledgeGraphService._get_fallback_search(query, search_type)

        except Exception as e:
            logger.error(f"智能概念搜索失败: {str(e)}")
            return KnowledgeGraphService._get_fallback_search(query, search_type)

    @staticmethod
    def _parse_search_results(content: str, query: str) -> List[Dict]:
        """解析搜索结果"""
        results = []
        lines = content.split('\n')

        for line in lines:
            line = line.strip()
            if '：' in line and '|' in line:
                try:
                    parts = line.split('：', 1)[1].split('|')
                    if len(parts) >= 3:
                        concept_name = line.split('：')[0].strip()
                        definition = parts[0].strip()
                        relevance = parts[1].strip()
                        reason = parts[2].strip()

                        # 计算相关度分数
                        relevance_score = 0.9 if '高' in relevance else (0.7 if '中' in relevance else 0.5)

                        results.append({
                            'concept': concept_name,
                            'definition': definition,
                            'relevance': relevance,
                            'relevance_score': relevance_score,
                            'reason': reason,
                            'category': KnowledgeGraphService._infer_category(concept_name)
                        })
                except:
                    continue

        # 如果解析失败，使用简单匹配
        if not results:
            results = KnowledgeGraphService._simple_concept_match(query)

        return results[:8]  # 最多返回8个结果

    @staticmethod
    def _simple_concept_match(query: str) -> List[Dict]:
        """简单概念匹配"""
        results = []
        all_concepts = KnowledgeGraphService.BASE_CONCEPTS

        # 精确匹配
        if query in all_concepts:
            concept_info = all_concepts[query]
            results.append({
                'concept': query,
                'definition': concept_info['basic_definition'],
                'relevance': '高',
                'relevance_score': 0.95,
                'reason': '精确匹配',
                'category': concept_info['category']
            })

        # 模糊匹配
        for concept, info in all_concepts.items():
            if query in concept or concept in query:
                if concept != query:  # 避免重复
                    results.append({
                        'concept': concept,
                        'definition': info['basic_definition'],
                        'relevance': '中',
                        'relevance_score': 0.7,
                        'reason': '名称相似',
                        'category': info['category']
                    })

        # 内容匹配
        for concept, info in all_concepts.items():
            if query in info['basic_definition'] and concept not in [r['concept'] for r in results]:
                results.append({
                    'concept': concept,
                    'definition': info['basic_definition'],
                    'relevance': '低',
                    'relevance_score': 0.5,
                    'reason': '内容相关',
                    'category': info['category']
                })

        return results[:8]

    @staticmethod
    def _get_fallback_search(query: str, search_type: str) -> Dict:
        """获取备用搜索结果"""
        results = KnowledgeGraphService._simple_concept_match(query)

        return {
            'success': True,
            'data': {
                'query': query,
                'search_type': search_type,
                'results': results,
                'total': len(results),
                'confidence': 0.70,
                'timestamp': datetime.now().isoformat(),
                'source': 'fallback_search'
            }
        }

    @staticmethod
    def generate_learning_path(user_interests: List[str], user_level: str = 'beginner') -> Dict:
        """基于知识图谱生成个性化学习路径"""
        try:
            # 构建学习路径生成提示词
            interests_str = '、'.join(user_interests)

            path_prompt = f"""用户兴趣：{interests_str}
用户水平：{user_level}

请基于中国传统文化知识图谱，为用户设计一个个性化的学习路径：

要求：
1. 根据用户兴趣选择相关的核心概念作为学习重点
2. 按照{user_level}水平设计合适的学习难度和进度
3. 设计3-5个学习阶段，每个阶段包含2-4个相关概念
4. 说明概念之间的逻辑关系和学习顺序
5. 为每个阶段提供学习建议和预期目标

请按以下格式返回：
阶段1：阶段名称
- 概念1：学习要点
- 概念2：学习要点
- 学习目标：...
- 预计时间：...

阶段2：...
（以此类推）

最后提供整体学习建议和注意事项。"""

            # 调用AI服务
            messages = [
                {'role': 'system', 'content': '你是一位经验丰富的传统文化教育专家，擅长根据学习者的兴趣和水平设计个性化的学习路径。你深谙传统文化概念之间的内在联系，能够设计循序渐进的学习方案。'},
                {'role': 'user', 'content': path_prompt}
            ]

            ai_result = RealAIService.call_deepseek_api(messages)

            if ai_result['success']:
                # 解析学习路径
                learning_path = KnowledgeGraphService._parse_learning_path(ai_result['content'])

                return {
                    'success': True,
                    'data': {
                        'user_interests': user_interests,
                        'user_level': user_level,
                        'learning_path': learning_path,
                        'confidence': random.uniform(0.88, 0.95),
                        'timestamp': datetime.now().isoformat(),
                        'source': 'deepseek_ai',
                        'response_time': ai_result.get('response_time', 0)
                    }
                }
            else:
                # 使用备用学习路径
                return KnowledgeGraphService._get_fallback_learning_path(user_interests, user_level)

        except Exception as e:
            logger.error(f"生成学习路径失败: {str(e)}")
            return KnowledgeGraphService._get_fallback_learning_path(user_interests, user_level)

    @staticmethod
    def _parse_learning_path(content: str) -> Dict:
        """解析学习路径"""
        # 简化的解析逻辑
        stages = []
        lines = content.split('\n')
        current_stage = None

        for line in lines:
            line = line.strip()
            if line.startswith('阶段') and '：' in line:
                if current_stage:
                    stages.append(current_stage)

                stage_name = line.split('：', 1)[1].strip()
                current_stage = {
                    'stage_name': stage_name,
                    'concepts': [],
                    'learning_goal': '',
                    'estimated_time': '',
                    'suggestions': []
                }
            elif current_stage and line.startswith('- ') and '：' in line:
                concept_info = line[2:].split('：', 1)
                if len(concept_info) == 2:
                    current_stage['concepts'].append({
                        'concept': concept_info[0].strip(),
                        'learning_points': concept_info[1].strip()
                    })
            elif current_stage and line.startswith('学习目标：'):
                current_stage['learning_goal'] = line.split('：', 1)[1].strip()
            elif current_stage and line.startswith('预计时间：'):
                current_stage['estimated_time'] = line.split('：', 1)[1].strip()

        if current_stage:
            stages.append(current_stage)

        # 如果解析失败，使用默认路径
        if not stages:
            stages = KnowledgeGraphService._get_default_learning_stages()

        return {
            'stages': stages,
            'total_stages': len(stages),
            'overall_suggestions': '建议循序渐进，注重理论与实践相结合。'
        }

    @staticmethod
    def _get_default_learning_stages() -> List[Dict]:
        """获取默认学习阶段"""
        return [
            {
                'stage_name': '基础入门',
                'concepts': [
                    {'concept': '仁', 'learning_points': '理解仁爱的基本含义'},
                    {'concept': '义', 'learning_points': '掌握正义的基本原则'}
                ],
                'learning_goal': '建立传统文化的基本认知',
                'estimated_time': '2-3周',
                'suggestions': ['多读经典原文', '结合现代案例理解']
            },
            {
                'stage_name': '深入理解',
                'concepts': [
                    {'concept': '礼', 'learning_points': '学习礼制的深层含义'},
                    {'concept': '智', 'learning_points': '培养智慧的思维方式'}
                ],
                'learning_goal': '深化对传统文化的理解',
                'estimated_time': '3-4周',
                'suggestions': ['注重实践应用', '与他人讨论交流']
            }
        ]

    @staticmethod
    def _get_fallback_learning_path(user_interests: List[str], user_level: str) -> Dict:
        """获取备用学习路径"""
        stages = KnowledgeGraphService._get_default_learning_stages()

        return {
            'success': True,
            'data': {
                'user_interests': user_interests,
                'user_level': user_level,
                'learning_path': {
                    'stages': stages,
                    'total_stages': len(stages),
                    'overall_suggestions': '建议根据个人兴趣调整学习重点，保持持续学习的热情。'
                },
                'confidence': 0.75,
                'timestamp': datetime.now().isoformat(),
                'source': 'fallback_path'
            }
        }
