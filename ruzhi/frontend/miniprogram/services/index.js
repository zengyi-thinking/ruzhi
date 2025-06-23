/**
 * 服务模块集合
 * 提供所有AI增强服务的统一导出
 */

const classicInterpretService = require('./classicInterpretService')
const virtualDialogueService = require('./virtualDialogueService')
const learningAssistantService = require('./learningAssistantService')
const knowledgeGraphService = require('./knowledgeGraphService')
const poetryGenerationService = require('./poetryGenerationService')

module.exports = {
  classicInterpretService,
  virtualDialogueService,
  learningAssistantService,
  knowledgeGraphService,
  poetryGenerationService
} 