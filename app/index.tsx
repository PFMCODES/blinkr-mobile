import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import type { JSX } from "react";
import * as React from "react";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview/lib/WebViewTypes";

interface MenuOption {
  id: string;
  title: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function App(): JSX.Element {
  const [url, setUrl] = useState<string>("https://google.com");
  const [currentUrl, setCurrentUrl] = useState<string>("https://google.com");
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const webViewRef = useRef<WebView>(null);
  const router = useRouter();
  const [reloadAnim] = useState(new Animated.Value(0));
  const inputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });

  // Function to validate and format URL
  const animateReload = () => {
    reloadAnim.setValue(0);
    Animated.timing(reloadAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };
  const formatUrl = (inputUrl: string): string => {
    let formattedUrl = inputUrl.trim();
    
    // If it doesn't start with http/https, add https://
    if (!formattedUrl.startsWith('http://') && !formattedUrl.includes('://') && !formattedUrl.startsWith('https://') && !formattedUrl.startsWith('data:')) {
      // Check if it looks like a domain (contains a dot)
      if (formattedUrl.includes('.')) {
        formattedUrl = 'https://' + formattedUrl;
      } else {
        // Treat as search query
        formattedUrl = `https://www.google.com/search?q=${encodeURIComponent(formattedUrl)}`;
      }
    }
    
    return formattedUrl;
  };

  // Handle URL submission
  const handleSubmit = (): void => {
    const formattedUrl = formatUrl(url);
    setCurrentUrl(formattedUrl);
    setUrl(formattedUrl);
  };

  // Navigation functions
  const goBack = (): void => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current.goBack();
    }
    setShowMoreMenu(false);
  };

  const goForward = (): void => {
    if (webViewRef.current && canGoForward) {
      webViewRef.current.goForward();
    }
    setShowMoreMenu(false);
  };

  const refresh = (): void => {
    if (webViewRef.current) {
      webViewRef.current.reload();
      animateReload();
    }
  };
  const handleMorePress = (): void => {
    setShowMoreMenu(true);
  };

  const closeMoreMenu = (): void => {
    setShowMoreMenu(false);
  };

  // Share/Copy functionality
  const handleShare = async (): Promise<void> => {
    try {
      const result = await Share.share({
        message: currentUrl,
        url: currentUrl, // iOS only
        title: 'Share Page', // Android only
      });
      
      if (result.action === Share.sharedAction) {
        // Successfully shared
        console.log('Page shared successfully');
      } else if (result.action === Share.dismissedAction) {
        // Share dialog dismissed
        console.log('Share dialog dismissed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share the page');
      console.error('Share error:', error);
    }
    setShowMoreMenu(false);
  };

  // Menu options
  const menuOptions: MenuOption[] = [
    {
      id: 'back',
      title: 'Back',
      icon: <Ionicons name="arrow-back" size={22} color="#fff" />,
      action: goBack,
    },
    {
      id: 'forward',
      title: 'Forward',
      icon: <Ionicons name="arrow-forward" size={22} color="#fff" />,
      action: goForward,
    },
    {
      id: 'refresh',
      title: 'Refresh',
      icon: <Ionicons name="reload" size={18} color='#fff'/>,
      action: () => {
        refresh();
        setShowMoreMenu(false);
      },
    },
    {
      id: 'share',
      title: 'Share',
      icon: <Ionicons name="share-outline"  size={24} color="#fff"/>,
      action: handleShare,
    },
    {
      id: 'bookmarks',
      title: 'Bookmarks',
      icon: <Ionicons name="bookmark-outline" size={22} color="#fff" />,
      action: () => {
        Alert.alert('Bookmarks', 'Bookmarks feature coming soon!');
        setShowMoreMenu(false);
      },
    },
    {
      id: 'history',
      title: 'History',
      icon: <Ionicons name="time-outline" size={22} color="#fff" />,
      action: () => {
        Alert.alert('History', 'History feature coming soon!');
        setShowMoreMenu(false);
      },
    },
    {
      id: 'downloads',
      title: 'Downloads',
      icon: <Ionicons name="download-outline" size={22} color="#fff" />,
      action: () => {
        router.push("/downloads");
        setShowMoreMenu(false);
      },
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Ionicons name="settings-outline" size={22} color="#fff" />,
      action: () => {
        router.push("/setting")
        setShowMoreMenu(false);
      },
    },
    {
      id: 'desktop',
      title: 'Desktop site',
      icon: <Ionicons name="desktop-outline" size={22} color="#fff" />,
      action: () => {
        Alert.alert('Desktop Site', 'Desktop site feature coming soon!');
        setShowMoreMenu(false);
      },
    },
    {
      id: 'find',
      title: 'Find in page',
      icon: <Ionicons name="search-outline" size={22} color="#fff" />,
      action: () => {
        Alert.alert('Find', 'Find in page feature coming soon!');
        setShowMoreMenu(false);
      },
    },
  ];

  // WebView event handlers
  const onNavigationStateChange = (navState: WebViewNavigation): void => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    setUrl(navState.url);
  };

  const onLoadStart = (): void => {
    setLoading(true);
  };

  const onLoadEnd = (): void => {
    setLoading(false);
  };

  const onError = (syntheticEvent: any): void => {
    const { nativeEvent } = syntheticEvent;
    Alert.alert('Error', `Failed to load page: ${nativeEvent.description}`);
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.topSection}
      >
        {/* Address Bar with Reload and More buttons */}
        <View style={styles.addressBar}>
          <TouchableOpacity onPress={refresh}>
            <Animated.View style={{
              transform: [{
                rotate: reloadAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }]
            }}>
              <Ionicons style={{
                marginLeft: 15,
                marginRight: 0,
  }} name="reload" size={16} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
          
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Enter URL or search..."
            placeholderTextColor="#c4c4c4"
            value={url}
            onChangeText={setUrl}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
            autoCapitalize="none"
            autoCorrect={false}
            selection={selection}
            onFocus={() => setSelection({ start: 0, end: url.length })}
          />
          
          <TouchableOpacity style={[styles.sideButton, { right: 4 }]} onPress={handleMorePress}>
            <Ionicons name="ellipsis-vertical" size={18} color="#fff" />
          </TouchableOpacity>
          
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webview}
        onNavigationStateChange={onNavigationStateChange}
        onLoadStart={onLoadStart}
        onLoadEnd={onLoadEnd}
        onError={onError}
        startInLoadingState={true}
        scalesPageToFit={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onFileDownload={({ nativeEvent }) => {
          const url = nativeEvent.downloadUrl;
          let filename = url.split('/').pop()?.split('?')[0] || `file_${Date.now()}`;
          if (!filename.includes('.') && url.includes('filename=')) {
            const match = url.match(/filename=([^&]+)/);
            if (match && match[1]) filename = decodeURIComponent(match[1]);
          }
          if (!filename.includes('.')) filename += '.bin';

          const destDir = FileSystem.documentDirectory + "Blinkr/";
          const destPath = destDir + filename;
          FileSystem.makeDirectoryAsync(destDir, { intermediates: true })
            .then(() => FileSystem.downloadAsync(url, destPath))
            .then(() => {
              Alert.alert("Download complete", `Saved to ${destPath}`);
            })
            .catch((err) => {
              Alert.alert("Download failed", err.message);
            });
        }}
      />

      {/* More Menu Modal */}
      <Modal
        visible={showMoreMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMoreMenu}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeMoreMenu}
        >
          <View style={styles.menuContainer}>
            <ScrollView style={styles.menuScrollView}>
              {menuOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.menuItem,
                    (option.id === 'back' && !canGoBack) || 
                    (option.id === 'forward' && !canGoForward) 
                      ? styles.disabledMenuItem : null
                  ]}
                  onPress={option.action}
                  disabled={
                    (option.id === 'back' && !canGoBack) || 
                    (option.id === 'forward' && !canGoForward)
                  }
                >
                  <Text style={[
                    styles.menuIcon,
                    (option.id === 'back' && !canGoBack) || 
                    (option.id === 'forward' && !canGoForward) 
                      ? styles.disabledMenuText : null
                  ]}>
                    {option.icon}
                  </Text>
                  <Text style={[
                    styles.menuText,
                    (option.id === 'back' && !canGoBack) || 
                    (option.id === 'forward' && !canGoForward) 
                      ? styles.disabledMenuText : null
                  ]}>
                    {option.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#333",
    paddingTop: Platform.OS === 'ios' ? 50 : 25, // Account for status bar
  },
  topSection: {
    backgroundColor: "#333",
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  addressBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
    backgroundColor: "#444",
    borderColor: "#666",
    borderRadius: 8,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: 12,
    paddingLeft: 40, // Space for reload button
    paddingRight: 40, // Space for more button
    color: "#fff",
    fontSize: 16,
  },
  sideButton: {
    position: "absolute",
    zIndex: 1,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  sideButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingOverlay: {
    position: "absolute",
    right: 50,
    top: "50%",
    transform: [{ translateY: -10 }],
    zIndex: 2,
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
    backgroundColor: "#2c2c2c",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: Dimensions.get('window').height * 0.7,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Account for home indicator
  },
  menuScrollView: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#444",
  },
  menuIcon: {
    fontSize: 20,
    color: "#fff",
    width: 30,
    textAlign: "center",
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    color: "#fff",
    flex: 1,
  },
  disabledMenuItem: {
    opacity: 0.5,
  },
  disabledMenuText: {
    color: "#888",
  },
});