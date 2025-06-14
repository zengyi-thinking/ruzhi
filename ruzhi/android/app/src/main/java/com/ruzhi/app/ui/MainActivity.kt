package com.ruzhi.app.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import dagger.hilt.android.AndroidEntryPoint

import com.ruzhi.app.ui.theme.RuzhiTheme
import com.ruzhi.app.ui.components.BottomNavigationBar
import com.ruzhi.app.ui.home.HomeScreen
import com.ruzhi.app.ui.ocr.OCRScreen
import com.ruzhi.app.ui.chat.ChatScreen
import com.ruzhi.app.ui.classics.ClassicsScreen
import com.ruzhi.app.ui.classics.ClassicsDetailScreen
import com.ruzhi.app.ui.knowledge.KnowledgeScreen
import com.ruzhi.app.ui.profile.ProfileScreen
import com.ruzhi.app.ui.welcome.WelcomeScreen
import com.ruzhi.app.viewmodel.MainViewModel
import com.ruzhi.app.navigation.Screen
import com.ruzhi.app.utils.PermissionManager

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    private val viewModel: MainViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // 安装启动屏幕
        val splashScreen = installSplashScreen()
        
        super.onCreate(savedInstanceState)
        
        // 保持启动屏幕直到应用准备就绪
        splashScreen.setKeepOnScreenCondition {
            !viewModel.isAppReady.value
        }
        
        setContent {
            RuzhiTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    RuzhiApp(viewModel = viewModel)
                }
            }
        }
        
        // 初始化应用
        viewModel.initializeApp()
    }
}

@Composable
fun RuzhiApp(viewModel: MainViewModel) {
    val navController = rememberNavController()
    val appState by viewModel.appState.collectAsState()
    val hasShownWelcome by viewModel.hasShownWelcome.collectAsState()
    
    // 权限管理
    PermissionManager(
        onPermissionsGranted = {
            viewModel.onPermissionsGranted()
        }
    )
    
    // 根据应用状态决定显示内容
    when {
        !appState.isInitialized -> {
            // 显示加载屏幕
            LoadingScreen()
        }
        
        !hasShownWelcome -> {
            // 显示欢迎引导
            WelcomeScreen(
                onWelcomeComplete = {
                    viewModel.setHasShownWelcome(true)
                }
            )
        }
        
        else -> {
            // 显示主应用
            MainAppContent(
                navController = navController,
                viewModel = viewModel
            )
        }
    }
}

@Composable
fun MainAppContent(
    navController: NavHostController,
    viewModel: MainViewModel
) {
    Scaffold(
        bottomBar = {
            BottomNavigationBar(
                navController = navController,
                currentRoute = getCurrentRoute(navController)
            )
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            // 首页
            composable(Screen.Home.route) {
                HomeScreen(
                    navController = navController,
                    viewModel = viewModel
                )
            }
            
            // OCR识别
            composable(Screen.OCR.route) {
                OCRScreen(
                    navController = navController,
                    viewModel = viewModel
                )
            }
            
            // AI对话
            composable(Screen.Chat.route) {
                ChatScreen(
                    navController = navController,
                    viewModel = viewModel
                )
            }
            
            // 经典库
            composable(Screen.Classics.route) {
                ClassicsScreen(
                    navController = navController,
                    viewModel = viewModel
                )
            }
            
            // 经典详情
            composable(
                route = "${Screen.ClassicsDetail.route}/{bookId}",
                arguments = Screen.ClassicsDetail.arguments
            ) { backStackEntry ->
                val bookId = backStackEntry.arguments?.getString("bookId") ?: ""
                ClassicsDetailScreen(
                    bookId = bookId,
                    navController = navController,
                    viewModel = viewModel
                )
            }
            
            // 知识图谱
            composable(Screen.Knowledge.route) {
                KnowledgeScreen(
                    navController = navController,
                    viewModel = viewModel
                )
            }
            
            // 个人中心
            composable(Screen.Profile.route) {
                ProfileScreen(
                    navController = navController,
                    viewModel = viewModel
                )
            }
        }
    }
}

@Composable
fun LoadingScreen() {
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.primary
    ) {
        // 加载动画和Logo
        // 这里可以添加Lottie动画或自定义加载动画
    }
}

@Composable
fun getCurrentRoute(navController: NavHostController): String? {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    return navBackStackEntry?.destination?.route
}
