package com.ruzhi.app.data.repository

import com.ruzhi.app.data.local.dao.AIConfigDao
import com.ruzhi.app.data.local.dao.ChatHistoryDao
import com.ruzhi.app.data.local.entity.AIConfigEntity
import com.ruzhi.app.data.local.entity.ChatMessageEntity
import com.ruzhi.app.data.remote.api.AIApiService
import com.ruzhi.app.data.remote.dto.ChatRequest
import com.ruzhi.app.data.remote.dto.ChatResponse
import com.ruzhi.app.data.remote.dto.OCRExplanationRequest
import com.ruzhi.app.data.remote.dto.OCRExplanationResponse
import com.ruzhi.app.data.remote.dto.KnowledgeQARequest
import com.ruzhi.app.data.remote.dto.KnowledgeQAResponse
import com.ruzhi.app.domain.model.AIConfig
import com.ruzhi.app.domain.model.ChatMessage
import com.ruzhi.app.domain.model.OCRExplanation
import com.ruzhi.app.domain.model.KnowledgeAnswer
import com.ruzhi.app.domain.repository.IAIRepository
import com.ruzhi.app.utils.NetworkResult
import com.ruzhi.app.utils.safeApiCall
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AIRepository @Inject constructor(
    private val aiApiService: AIApiService,
    private val aiConfigDao: AIConfigDao,
    private val chatHistoryDao: ChatHistoryDao
) : IAIRepository {

    // AI配置相关
    override suspend fun getAIConfig(): Flow<AIConfig?> {
        return aiConfigDao.getAIConfig().map { entity ->
            entity?.toDomainModel()
        }
    }

    override suspend fun saveAIConfig(config: AIConfig) {
        aiConfigDao.insertOrUpdate(config.toEntity())
    }

    override suspend fun testAPIConnection(apiKey: String): NetworkResult<Boolean> {
        return safeApiCall {
            val response = aiApiService.testConnection(apiKey)
            response.success
        }
    }

    // 聊天相关
    override suspend fun chatWithHistoricalFigure(
        character: String,
        message: String,
        history: List<ChatMessage>,
        apiKey: String?
    ): NetworkResult<ChatResponse> {
        return safeApiCall {
            val request = ChatRequest(
                character = character,
                message = message,
                history = history.map { it.toDto() },
                apiKey = apiKey
            )
            
            val response = aiApiService.chatWithHistoricalFigure(request)
            
            // 保存聊天记录
            saveChatMessage(ChatMessage(
                id = System.currentTimeMillis().toString(),
                character = character,
                role = "user",
                content = message,
                timestamp = System.currentTimeMillis()
            ))
            
            saveChatMessage(ChatMessage(
                id = (System.currentTimeMillis() + 1).toString(),
                character = character,
                role = "assistant",
                content = response.message,
                timestamp = System.currentTimeMillis() + 1
            ))
            
            response
        }
    }

    override suspend fun getChatHistory(character: String): Flow<List<ChatMessage>> {
        return chatHistoryDao.getChatHistory(character).map { entities ->
            entities.map { it.toDomainModel() }
        }
    }

    override suspend fun saveChatMessage(message: ChatMessage) {
        chatHistoryDao.insert(message.toEntity())
    }

    override suspend fun clearChatHistory(character: String) {
        chatHistoryDao.clearHistory(character)
    }

    // OCR解释相关
    override suspend fun explainOCRText(
        text: String,
        context: String?,
        apiKey: String?
    ): NetworkResult<OCRExplanationResponse> {
        return safeApiCall {
            val request = OCRExplanationRequest(
                text = text,
                context = context,
                apiKey = apiKey
            )
            aiApiService.explainOCRText(request)
        }
    }

    // 知识问答相关
    override suspend fun answerQuestion(
        question: String,
        category: String,
        apiKey: String?
    ): NetworkResult<KnowledgeQAResponse> {
        return safeApiCall {
            val request = KnowledgeQARequest(
                question = question,
                category = category,
                apiKey = apiKey
            )
            aiApiService.answerQuestion(request)
        }
    }

    // 智能搜索相关
    override suspend fun searchAncientTexts(
        query: String,
        type: String,
        apiKey: String?
    ): NetworkResult<List<SearchResult>> {
        return safeApiCall {
            val request = SearchRequest(
                query = query,
                type = type,
                apiKey = apiKey
            )
            val response = aiApiService.searchAncientTexts(request)
            response.results
        }
    }

    // 生成模拟回答（降级方案）
    override suspend fun generateMockChatResponse(
        character: String,
        message: String
    ): ChatResponse {
        val responses = mapOf(
            "孔子" to listOf(
                "学而时习之，不亦说乎？关于您的问题，我认为...",
                "仁者爱人，智者知人。您提到的问题很有深度...",
                "三人行，必有我师焉。让我们一起探讨这个问题..."
            ),
            "老子" to listOf(
                "道可道，非常道。您的问题触及了事物的本质...",
                "无为而治，顺其自然。对于这个问题，我的看法是...",
                "知者不言，言者不知。但我愿意与您分享一些思考..."
            ),
            "孟子" to listOf(
                "人之初，性本善。关于您的疑问，我想说...",
                "民为贵，社稷次之，君为轻。您的问题很重要...",
                "富贵不能淫，贫贱不能移。让我来回答您的问题..."
            )
        )

        val characterResponses = responses[character] ?: responses["孔子"]!!
        val randomResponse = characterResponses.random()

        return ChatResponse(
            success = true,
            message = randomResponse,
            character = character,
            timestamp = System.currentTimeMillis(),
            source = "mock"
        )
    }

    override suspend fun generateMockOCRExplanation(text: String): OCRExplanationResponse {
        return OCRExplanationResponse(
            success = true,
            explanation = "关于"${text}"这段文字，从传统文化的角度来看，它体现了深厚的文化内涵。建议您深入学习相关经典，以获得更准确的理解。",
            originalText = text,
            timestamp = System.currentTimeMillis(),
            source = "mock"
        )
    }

    override suspend fun generateMockKnowledgeAnswer(
        question: String,
        category: String
    ): KnowledgeQAResponse {
        return KnowledgeQAResponse(
            success = true,
            answer = "关于"${question}"这个问题，涉及到中国传统文化的重要内容。建议您深入学习相关经典，或咨询专业的文化学者以获得更准确的答案。",
            question = question,
            category = category,
            timestamp = System.currentTimeMillis(),
            source = "mock"
        )
    }
}

// 扩展函数：实体转换
private fun AIConfigEntity.toDomainModel(): AIConfig {
    return AIConfig(
        apiKey = this.apiKey,
        connected = this.connected,
        lastTestTime = this.lastTestTime,
        errorMessage = this.errorMessage,
        features = this.features,
        usage = this.usage
    )
}

private fun AIConfig.toEntity(): AIConfigEntity {
    return AIConfigEntity(
        id = 1, // 单例配置
        apiKey = this.apiKey,
        connected = this.connected,
        lastTestTime = this.lastTestTime,
        errorMessage = this.errorMessage,
        features = this.features,
        usage = this.usage
    )
}

private fun ChatMessageEntity.toDomainModel(): ChatMessage {
    return ChatMessage(
        id = this.id,
        character = this.character,
        role = this.role,
        content = this.content,
        timestamp = this.timestamp
    )
}

private fun ChatMessage.toEntity(): ChatMessageEntity {
    return ChatMessageEntity(
        id = this.id,
        character = this.character,
        role = this.role,
        content = this.content,
        timestamp = this.timestamp
    )
}

private fun ChatMessage.toDto(): com.ruzhi.app.data.remote.dto.ChatMessage {
    return com.ruzhi.app.data.remote.dto.ChatMessage(
        role = this.role,
        content = this.content,
        timestamp = this.timestamp
    )
}
