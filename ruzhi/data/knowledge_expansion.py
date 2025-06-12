#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
儒智项目知识库扩充脚本
用于扩充《论语》和《孟子》的内容，建立概念关系网络
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Any

class KnowledgeExpansion:
    def __init__(self, data_dir: str = "./"):
        self.data_dir = data_dir
        self.ensure_directories()
    
    def ensure_directories(self):
        """确保必要的目录存在"""
        dirs = [
            os.path.join(self.data_dir, "classics"),
            os.path.join(self.data_dir, "concepts"),
            os.path.join(self.data_dir, "relations"),
            os.path.join(self.data_dir, "annotations"),
            os.path.join(self.data_dir, "characters")
        ]
        for dir_path in dirs:
            os.makedirs(dir_path, exist_ok=True)
    
    def expand_lunyu_content(self):
        """扩充《论语》内容"""
        lunyu_data = {
            "title": "论语",
            "author": "孔子及其弟子",
            "description": "儒家经典著作，记录孔子及其弟子的言行",
            "chapters": [
                {
                    "chapter_id": "xue_er",
                    "chapter_name": "学而篇",
                    "chapter_number": 1,
                    "sections": [
                        {
                            "section_id": "1_1",
                            "original_text": "子曰：「学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？」",
                            "modern_translation": "孔子说：「学习了知识并且按时复习，不是很愉快吗？有朋友从远方来，不是很快乐吗？别人不了解我，我也不怨恨，不也是君子的品格吗？」",
                            "annotation": {
                                "key_concepts": ["学习", "复习", "友谊", "君子", "修养"],
                                "detailed_explanation": "这是《论语》的开篇之语，体现了孔子教育思想的核心：学习的快乐、友谊的珍贵、以及君子的修养。",
                                "historical_context": "春秋时期，孔子强调教育的重要性，认为学习是人生的乐趣之一。",
                                "modern_application": "在现代社会，终身学习的理念与孔子的教育思想不谋而合。",
                                "related_concepts": ["教育", "品德修养", "人际关系", "情绪管理"]
                            },
                            "commentary": [
                                {
                                    "commentator": "朱熹",
                                    "content": "学之时习，所以学者将以行之也。朋友远来，所以辅仁也。人不知而不愠，所以为君子也。"
                                },
                                {
                                    "commentator": "现代解读",
                                    "content": "这段话体现了孔子对学习、友谊和品格修养的深刻理解，是儒家思想的精髓体现。"
                                }
                            ]
                        },
                        {
                            "section_id": "1_2",
                            "original_text": "有子曰：「其为人也孝弟，而好犯上者，鲜矣；不好犯上，而好作乱者，未之有也。君子务本，本立而道生。孝弟也者，其为仁之本与！」",
                            "modern_translation": "有子说：「一个人如果孝顺父母、敬爱兄长，却喜欢冒犯上级的，是很少的；不喜欢冒犯上级，却喜欢造反作乱的，是没有的。君子专心致力于根本，根本确立了，道就产生了。孝顺父母、敬爱兄长，这就是仁的根本吧！」",
                            "annotation": {
                                "key_concepts": ["孝悌", "仁", "君子", "根本", "道"],
                                "detailed_explanation": "有子强调孝悌是仁德的根本，体现了儒家重视家庭伦理的思想。",
                                "historical_context": "春秋时期社会动荡，儒家强调从家庭伦理出发建立社会秩序。",
                                "modern_application": "现代社会中，家庭教育和孝道仍然是品德教育的重要内容。",
                                "related_concepts": ["家庭伦理", "社会秩序", "品德教育", "仁爱"]
                            }
                        }
                    ]
                },
                {
                    "chapter_id": "wei_zheng",
                    "chapter_name": "为政篇",
                    "chapter_number": 2,
                    "sections": [
                        {
                            "section_id": "2_1",
                            "original_text": "子曰：「为政以德，譬如北辰，居其所而众星共之。」",
                            "modern_translation": "孔子说：「用道德来治理国家，就像北极星一样，安居在自己的位置上，众星都围绕着它。」",
                            "annotation": {
                                "key_concepts": ["德治", "政治", "道德", "领导力"],
                                "detailed_explanation": "孔子提出德治思想，认为统治者应该以德服人，而不是以力服人。",
                                "historical_context": "春秋时期政治混乱，孔子提出德治理念作为治国方略。",
                                "modern_application": "现代政治中，道德领导力仍然是重要的治理理念。",
                                "related_concepts": ["政治哲学", "领导艺术", "道德治理", "社会管理"]
                            }
                        }
                    ]
                }
            ],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # 保存到文件
        with open(os.path.join(self.data_dir, "classics", "lunyu_expanded.json"), "w", encoding="utf-8") as f:
            json.dump(lunyu_data, f, ensure_ascii=False, indent=2)
        
        print("《论语》内容扩充完成")
        return lunyu_data
    
    def expand_mengzi_content(self):
        """扩充《孟子》内容"""
        mengzi_data = {
            "title": "孟子",
            "author": "孟子",
            "description": "儒家经典著作，发展了孔子的思想，提出性善论",
            "chapters": [
                {
                    "chapter_id": "liang_hui_wang",
                    "chapter_name": "梁惠王章句",
                    "chapter_number": 1,
                    "sections": [
                        {
                            "section_id": "1_1",
                            "original_text": "孟子见梁惠王。王曰：「叟不远千里而来，亦将有以利吾国乎？」孟子对曰：「王何必曰利？亦有仁义而已矣。」",
                            "modern_translation": "孟子拜见梁惠王。王说：「老先生不远千里而来，也是要有什么来使我的国家获利吧？」孟子回答说：「大王何必说利呢？只要有仁义就够了。」",
                            "annotation": {
                                "key_concepts": ["仁义", "利益", "政治理念", "王道"],
                                "detailed_explanation": "孟子强调仁义高于利益，体现了儒家重义轻利的价值观。",
                                "historical_context": "战国时期各国争霸，孟子提出仁政理念对抗功利主义。",
                                "modern_application": "现代社会中，价值观与利益的平衡仍然是重要议题。",
                                "related_concepts": ["价值观", "政治伦理", "社会责任", "道德选择"]
                            }
                        }
                    ]
                },
                {
                    "chapter_id": "li_lou",
                    "chapter_name": "离娄章句",
                    "chapter_number": 4,
                    "sections": [
                        {
                            "section_id": "4_1",
                            "original_text": "孟子曰：「仁之实，事亲是也；义之实，从兄是也。」",
                            "modern_translation": "孟子说：「仁的实质，就是侍奉父母；义的实质，就是顺从兄长。」",
                            "annotation": {
                                "key_concepts": ["仁", "义", "孝悌", "家庭伦理"],
                                "detailed_explanation": "孟子将抽象的仁义概念具体化为家庭伦理关系。",
                                "historical_context": "孟子继承并发展了孔子的思想，强调仁义的实践性。",
                                "modern_application": "家庭关系仍然是现代社会道德教育的基础。",
                                "related_concepts": ["道德实践", "家庭教育", "伦理关系", "品德培养"]
                            }
                        }
                    ]
                }
            ],
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # 保存到文件
        with open(os.path.join(self.data_dir, "classics", "mengzi_expanded.json"), "w", encoding="utf-8") as f:
            json.dump(mengzi_data, f, ensure_ascii=False, indent=2)
        
        print("《孟子》内容扩充完成")
        return mengzi_data
    
    def create_concept_relations(self):
        """创建概念关系网络"""
        relations = {
            "concepts": [
                {
                    "id": "ren",
                    "name": "仁",
                    "definition": "儒家核心概念，指仁爱、仁慈、人道",
                    "category": "核心价值",
                    "importance": 10,
                    "related_texts": ["论语", "孟子"],
                    "modern_relevance": "现代人文关怀、社会责任的基础"
                },
                {
                    "id": "yi",
                    "name": "义",
                    "definition": "正义、道义、应该做的事",
                    "category": "核心价值",
                    "importance": 9,
                    "related_texts": ["论语", "孟子"],
                    "modern_relevance": "现代法治精神、道德准则的体现"
                },
                {
                    "id": "li",
                    "name": "礼",
                    "definition": "礼仪、制度、社会规范",
                    "category": "社会制度",
                    "importance": 8,
                    "related_texts": ["论语"],
                    "modern_relevance": "现代社会秩序、文明礼貌的基础"
                },
                {
                    "id": "xiao_ti",
                    "name": "孝悌",
                    "definition": "孝顺父母、敬爱兄长",
                    "category": "家庭伦理",
                    "importance": 9,
                    "related_texts": ["论语", "孟子"],
                    "modern_relevance": "现代家庭教育、孝道文化的核心"
                }
            ],
            "relations": [
                {
                    "from": "xiao_ti",
                    "to": "ren",
                    "relation_type": "基础关系",
                    "strength": 0.9,
                    "description": "孝悌是仁的根本"
                },
                {
                    "from": "ren",
                    "to": "yi",
                    "relation_type": "并列关系",
                    "strength": 0.8,
                    "description": "仁义并重，相辅相成"
                },
                {
                    "from": "li",
                    "to": "ren",
                    "relation_type": "实现关系",
                    "strength": 0.7,
                    "description": "礼是仁的外在表现"
                }
            ],
            "created_at": datetime.now().isoformat()
        }
        
        # 保存到文件
        with open(os.path.join(self.data_dir, "relations", "concept_relations.json"), "w", encoding="utf-8") as f:
            json.dump(relations, f, ensure_ascii=False, indent=2)
        
        print("概念关系网络创建完成")
        return relations
    
    def expand_historical_characters(self):
        """扩展历史人物库"""
        characters = {
            "characters": [
                {
                    "id": "confucius",
                    "name": "孔子",
                    "full_name": "孔丘",
                    "birth_year": -551,
                    "death_year": -479,
                    "dynasty": "春秋",
                    "title": "至圣先师",
                    "description": "儒家学派创始人，中国古代伟大的思想家、教育家",
                    "key_thoughts": ["仁", "礼", "教育", "德治"],
                    "famous_quotes": [
                        "学而时习之，不亦说乎？",
                        "己所不欲，勿施于人",
                        "三人行，必有我师焉"
                    ],
                    "personality_traits": {
                        "wisdom": 10,
                        "compassion": 9,
                        "patience": 8,
                        "humor": 7,
                        "strictness": 6
                    },
                    "dialogue_style": "温和而深刻，善于启发，常用比喻",
                    "modern_relevance": "教育理念、道德修养在现代仍有重要意义"
                },
                {
                    "id": "mencius",
                    "name": "孟子",
                    "full_name": "孟轲",
                    "birth_year": -372,
                    "death_year": -289,
                    "dynasty": "战国",
                    "title": "亚圣",
                    "description": "儒家学派重要代表，发展了孔子思想，提出性善论",
                    "key_thoughts": ["性善论", "仁政", "民本", "浩然之气"],
                    "famous_quotes": [
                        "人之初，性本善",
                        "民为贵，社稷次之，君为轻",
                        "富贵不能淫，贫贱不能移，威武不能屈"
                    ],
                    "personality_traits": {
                        "wisdom": 9,
                        "righteousness": 10,
                        "courage": 9,
                        "eloquence": 10,
                        "idealism": 9
                    },
                    "dialogue_style": "雄辩有力，逻辑严密，富有激情",
                    "modern_relevance": "人性观、政治理念对现代民主思想有启发"
                }
            ],
            "created_at": datetime.now().isoformat()
        }
        
        # 保存到文件
        with open(os.path.join(self.data_dir, "characters", "historical_figures.json"), "w", encoding="utf-8") as f:
            json.dump(characters, f, ensure_ascii=False, indent=2)
        
        print("历史人物库扩展完成")
        return characters
    
    def run_expansion(self):
        """运行完整的知识库扩充"""
        print("开始知识库扩充...")
        
        # 扩充经典内容
        lunyu_data = self.expand_lunyu_content()
        mengzi_data = self.expand_mengzi_content()
        
        # 创建概念关系
        relations = self.create_concept_relations()
        
        # 扩展历史人物
        characters = self.expand_historical_characters()
        
        # 创建汇总信息
        summary = {
            "expansion_date": datetime.now().isoformat(),
            "statistics": {
                "lunyu_sections": len([s for c in lunyu_data["chapters"] for s in c["sections"]]),
                "mengzi_sections": len([s for c in mengzi_data["chapters"] for s in c["sections"]]),
                "concepts": len(relations["concepts"]),
                "relations": len(relations["relations"]),
                "characters": len(characters["characters"])
            },
            "next_steps": [
                "继续扩充更多章节内容",
                "完善概念关系网络",
                "添加更多历史人物",
                "建立现代应用案例库"
            ]
        }
        
        with open(os.path.join(self.data_dir, "expansion_summary.json"), "w", encoding="utf-8") as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print("知识库扩充完成！")
        print(f"- 《论语》章节：{summary['statistics']['lunyu_sections']}个")
        print(f"- 《孟子》章节：{summary['statistics']['mengzi_sections']}个")
        print(f"- 核心概念：{summary['statistics']['concepts']}个")
        print(f"- 概念关系：{summary['statistics']['relations']}个")
        print(f"- 历史人物：{summary['statistics']['characters']}个")
        
        return summary

if __name__ == "__main__":
    expander = KnowledgeExpansion()
    expander.run_expansion()
