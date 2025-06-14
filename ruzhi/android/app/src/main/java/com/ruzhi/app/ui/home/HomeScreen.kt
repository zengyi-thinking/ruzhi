package com.ruzhi.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import coil.request.ImageRequest

import com.ruzhi.app.domain.model.DailyQuote
import com.ruzhi.app.domain.model.LearningStats
import com.ruzhi.app.domain.model.Recommendation
import com.ruzhi.app.navigation.Screen
import com.ruzhi.app.ui.components.GradientCard
import com.ruzhi.app.ui.components.LoadingIndicator
import com.ruzhi.app.ui.components.ErrorMessage
import com.ruzhi.app.ui.theme.RuzhiColors
import com.ruzhi.app.viewmodel.HomeViewModel
import com.ruzhi.app.viewmodel.MainViewModel

@Composable
fun HomeScreen(
    navController: NavController,
    viewModel: MainViewModel,
    homeViewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by homeViewModel.uiState.collectAsState()
    val userInfo by viewModel.userInfo.collectAsState()
    val learningStats by viewModel.learningStats.collectAsState()

    LaunchedEffect(Unit) {
        homeViewModel.loadHomeData()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        RuzhiColors.Primary,
                        RuzhiColors.Background
                    )
                )
            ),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 欢迎区域
        item {
            WelcomeSection(
                userName = userInfo?.nickname ?: "用户",
                userAvatar = userInfo?.avatar
            )
        }

        // 学习统计
        item {
            StatsOverviewSection(stats = learningStats)
        }

        // 每日一句
        uiState.dailyQuote?.let { quote ->
            item {
                DailyQuoteSection(
                    quote = quote,
                    onClick = { homeViewModel.showQuoteDetail(quote) }
                )
            }
        }

        // 学习打卡
        item {
            CheckinSection(
                streak = learningStats.streak,
                checkedIn = uiState.todayCheckedIn,
                onCheckin = { homeViewModel.performDailyCheckin() }
            )
        }

        // 功能导航
        item {
            FeaturesSection(
                onFeatureClick = { feature ->
                    when (feature) {
                        "ocr" -> navController.navigate(Screen.OCR.route)
                        "chat" -> navController.navigate(Screen.Chat.route)
                        "classics" -> navController.navigate(Screen.Classics.route)
                        "knowledge" -> navController.navigate(Screen.Knowledge.route)
                    }
                }
            )
        }

        // 今日推荐
        if (uiState.recommendations.isNotEmpty()) {
            item {
                RecommendationsSection(
                    recommendations = uiState.recommendations,
                    onRecommendationClick = { recommendation ->
                        when (recommendation.type) {
                            "classic" -> navController.navigate("${Screen.ClassicsDetail.route}/${recommendation.bookId}")
                            "chat" -> navController.navigate(Screen.Chat.route)
                        }
                    },
                    onViewMore = { navController.navigate(Screen.Classics.route) }
                )
            }
        }

        // 最近活动
        item {
            RecentActivitySection(
                activities = uiState.recentActivities
            )
        }

        // 加载状态
        if (uiState.isLoading) {
            item {
                LoadingIndicator()
            }
        }

        // 错误状态
        uiState.error?.let { error ->
            item {
                ErrorMessage(
                    message = error,
                    onRetry = { homeViewModel.loadHomeData() }
                )
            }
        }
    }
}

@Composable
private fun WelcomeSection(
    userName: String,
    userAvatar: String?
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White.copy(alpha = 0.9f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "欢迎回来，$userName",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = RuzhiColors.TextPrimary
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "探索传统文化的智慧",
                    style = MaterialTheme.typography.bodyMedium,
                    color = RuzhiColors.TextSecondary
                )
            }
            
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(userAvatar)
                    .crossfade(true)
                    .build(),
                contentDescription = "用户头像",
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        }
    }
}

@Composable
private fun StatsOverviewSection(stats: LearningStats) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Text(
                text = "学习统计",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem(
                    label = "学习天数",
                    value = stats.totalDays.toString(),
                    icon = Icons.Default.CalendarToday
                )
                StatItem(
                    label = "阅读章节",
                    value = stats.completedChapters.toString(),
                    icon = Icons.Default.MenuBook
                )
                StatItem(
                    label = "连续天数",
                    value = stats.streak.toString(),
                    icon = Icons.Default.LocalFire
                )
                StatItem(
                    label = "积分",
                    value = stats.points.toString(),
                    icon = Icons.Default.Star
                )
            }
        }
    }
}

@Composable
private fun StatItem(
    label: String,
    value: String,
    icon: ImageVector
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = RuzhiColors.Primary,
            modifier = Modifier.size(24.dp)
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = value,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = RuzhiColors.Primary
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = RuzhiColors.TextSecondary
        )
    }
}

@Composable
private fun DailyQuoteSection(
    quote: DailyQuote,
    onClick: () -> Unit
) {
    GradientCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        gradient = Brush.horizontalGradient(
            colors = listOf(
                RuzhiColors.Primary,
                RuzhiColors.Secondary
            )
        )
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "📖 每日一句",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = quote.date,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.8f)
                )
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = quote.content,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = Color.White,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "—— ${quote.author}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.9f)
                )
                Text(
                    text = "《${quote.source}》",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.9f)
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "点击查看详解",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.8f)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.8f),
                    modifier = Modifier.size(16.dp)
                )
            }
        }
    }
}
