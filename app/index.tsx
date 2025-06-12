import { Ionicons } from '@expo/vector-icons';
import { Appearance } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from "expo-file-system";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { JSX } from "react";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
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
  const params = useLocalSearchParams();
  const justSetFromParams = useRef(false);
  const [showFindBar, setShowFindBar] = useState(false);
  const [findText, setFindText] = useState('');
  const [findIndex, setFindIndex] = useState(0);
  const [findCount, setFindCount] = useState(0);
  const [desktopMode, setDesktopMode] = useState(false);
  const desktopUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  const mobileUserAgent = undefined; // Use default mobile UA
  const [url, setUrl] = useState<string>("https://google.com");
  const [currentUrl, setCurrentUrl] = useState<string>("https://google.com");
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const webViewRef = useRef<WebView>(null);
  const router = useRouter();
  const [bookmarkIcon, setBookmarkIcon] = useState<'bookmark-outline' | 'bookmark'>('bookmark-outline');
  const [reloadAnim] = useState(new Animated.Value(0));
  const inputRef = useRef<TextInput>(null);
  const [findBarAnim] = useState(new Animated.Value(0));
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const darkStyles = StyleSheet.create({
  container: { backgroundColor: "#333"},
  text: { color: "#fff" },
  // ...add/replace other style keys as needed...
});

const lightStyles = StyleSheet.create({
  container: { backgroundColor: "#f5f5f5"},
  text: { color: "#222" },
  // ...add/replace other style keys as needed...
});
  const themed = theme === "dark" ? darkStyles : lightStyles;

  useEffect(() => {
    AsyncStorage.getItem("theme").then(val => {
      if (val === "light" || val === "dark") setTheme(val);
      else setTheme("light");
    });
  }, []);
      useEffect(() => {
        if (params.url && typeof params.url === "string") {
          setUrl(params.url);
          setCurrentUrl(params.url);
          justSetFromParams.current = true;
        }
        // eslint-disable-next-line
      }, []);
      useEffect(() => {
        Animated.timing(findBarAnim, {
          toValue: showFindBar ? 1 : 0,
          duration: 300,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      }, [showFindBar]);
  const runFindInPage = (text: string, index: number = 0) => {
  if (!text) {
    webViewRef.current?.injectJavaScript(`
      if(window.__clearFindHighlights){window.__clearFindHighlights();}
      true;
    `);
    setFindCount(0);
    return;
  }
  webViewRef.current?.injectJavaScript(`
      (function(){
        if(!window.__findInPage){
          window.__findInPage = function(text, idx){
            if(window.__clearFindHighlights){window.__clearFindHighlights();}
            var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            var matches = [];
            var nodes = [];
            var node;
            while(node = walker.nextNode()){
              var i = node.nodeValue.toLowerCase().indexOf(text.toLowerCase());
              while(i !== -1){
                matches.push({node: node, index: i});
                i = node.nodeValue.toLowerCase().indexOf(text.toLowerCase(), i + text.length);
              }
            }
            window.__findMatches = matches;
            window.__findText = text;
            window.__findIdx = idx;
            if(matches.length){
              var match = matches[idx % matches.length];
              var n = match.node;
              var i = match.index;
              var span = document.createElement('span');
              span.style.background = 'yellow';
              span.style.color = 'black';
              span.textContent = n.nodeValue.substr(i, text.length);
              var after = n.splitText(i);
              after.nodeValue = after.nodeValue.substr(text.length);
              n.parentNode.insertBefore(span, after);
              span.scrollIntoView({behavior:'smooth', block:'center'});
            }
            window.ReactNativeWebView.postMessage(JSON.stringify({type:'findCount', count:matches.length}));
          }
          window.__clearFindHighlights = function(){
            var spans = document.querySelectorAll('span[style*=\"background: yellow\"]');
            spans.forEach(function(span){
              var text = document.createTextNode(span.textContent);
              span.parentNode.replaceChild(text, span);
            });
          }
        }
        window.__findInPage(${JSON.stringify(text)}, ${index});
        true;
      })();
    `);
  };
  const isBookmarked = async (currentUrl: string): Promise<boolean> => {
    try {
      const stored = await AsyncStorage.getItem("bookmarks");
      if (!stored) return false;

      const bookmarks = JSON.parse(stored);
      return bookmarks.some((bookmark: any) => bookmark.url === currentUrl);
    } catch (err) {
      console.error("Error checking bookmark:", err);
      return false;
    }
  };
  let updateBookmarkIcon;
  useEffect(() => {
  updateBookmarkIcon = async () => {
    const bookmarked = await isBookmarked(currentUrl);
    setBookmarkIcon(bookmarked ? 'bookmark' : 'bookmark-outline');
  };

  updateBookmarkIcon();
}, [currentUrl]);

  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const saveBookmark = async () => {
      try {
        const newBookmark = {
          url: currentUrl,
          title: currentUrl, // or extract title using injected JS if needed
          timestamp: Date.now(),
        };

        const stored = await AsyncStorage.getItem("bookmarks");
        const bookmarks = stored ? JSON.parse(stored) : [];

        // Avoid duplicate
        const isDuplicate = bookmarks.some((b: any) => b.url === newBookmark.url);
        if (isDuplicate) {
          Alert.alert(
            "Already Bookmarked",
            "Remove this page from bookmarks?",
            [
              {
                text: "Cancel",
                style: "cancel"
              },
              {
                text: "OK",
                onPress: async () => {
                  // Remove the bookmark
                  const updated = bookmarks.filter((b: any) => b.url !== newBookmark.url);
                  await AsyncStorage.setItem("bookmarks", JSON.stringify(updated));
                  setBookmarkIcon('bookmark-outline');
                }
              }
            ]
          );
          return;
        }

        bookmarks.push(newBookmark);
        await AsyncStorage.setItem("bookmarks", JSON.stringify(bookmarks));
        setBookmarkIcon('bookmark'); // update icon
      } catch (err) {
        console.error("Failed to save bookmark:", err);
        Alert.alert("Error", "Failed to save the bookmark.");
      }

      setShowMoreMenu(false);
    };
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

  const onWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'findCount') {
        setFindCount(data.count);
      }
    } catch {}
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
      icon: <Ionicons name="arrow-back" size={22} color={theme === "dark" ? "#fff" : "#222"} />,
      action: goBack,
    },
    {
      id: 'forward',
      title: 'Forward',
      icon: <Ionicons name="arrow-forward" size={22} color={theme === "dark" ? "#fff" : "#222"} />,
      action: goForward,
    },
    {
      id: 'refresh',
      title: 'Refresh',
      icon: <Ionicons name="reload" size={18} color={theme === "dark" ? "#fff" : "#222"}/>,
      action: () => {
        refresh();
        setShowMoreMenu(false);
      },
    },
    {
      id: 'share',
      title: 'Share',
      icon: <Ionicons name="share-outline"  size={24} color={theme === "dark" ? "#fff" : "#222"}/>,
      action: handleShare,
    },
    {
      id: 'bookmarks',
      title: 'Bookmarks',
      icon: <Ionicons name={bookmarkIcon} size={22} color={theme === "dark" ? "#fff" : "#222"} />,
      action: saveBookmark,
    },
    {
      id: 'history',
      title: 'History',
      icon: <Ionicons name="time-outline" size={22} color={theme === "dark" ? "#fff" : "#222"} />,
      action: () => {
        router.push("/history")
        setShowMoreMenu(false);
      },
    },
    {
        id: 'bookmarks-2',
        title: 'See Bookmarks',
        icon: <Ionicons name="bookmarks-sharp" size={22} color={theme === "dark" ? "#fff" : "#222"} />,
        action: () => {
          router.push("/bookmarks");
          setShowMoreMenu(false);
        },
      },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Ionicons name="settings-outline" size={22} color={theme === "dark" ? "#fff" : "#222"} />,
      action: () => {
        router.push("/setting")
        setShowMoreMenu(false);
      },
    },
    {
      id: 'desktop',
      title: desktopMode ? 'Mobile site mode' : 'Desktop site mode',
      icon:  desktopMode ? <Ionicons name="phone-portrait-outline" size={22} color={theme === "dark" ? "#fff" : "#222"} /> : <Ionicons name="desktop-outline" size={22} color={theme === "dark" ? "#fff" : "#222"} />,
      action: () => {
        setDesktopMode(!desktopMode);
        setShowMoreMenu(false);
        // Optionally reload the page to apply the new user agent
        setTimeout(() => {
          if (webViewRef.current) webViewRef.current.reload();
        }, 100);
      },
    },
    {
      id: 'find',
      title: 'Find in page',
      icon: <Ionicons name="search-outline" size={22} color={theme === "dark" ? "#fff" : "#222"} />,
      action: () => {
        setShowMoreMenu(false);
        setShowFindBar(true);
      },
    },
  ];

  // WebView event handlers
  const onNavigationStateChange = (navState: WebViewNavigation): void => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);

    // Prevent immediate overwrite after setting from params
    if (justSetFromParams.current) {
      justSetFromParams.current = false;
      return;
    }

    setCurrentUrl(navState.url);
    setUrl(navState.url);

    AsyncStorage.getItem("history").then((data) => {
      let arr = [];
      try {
        arr = data ? JSON.parse(data) : [];
      } catch {
        arr = [];
      }
      // Avoid consecutive duplicates
      if (arr[arr.length - 1] !== navState.url) {
        arr.push(navState.url);
        AsyncStorage.setItem("history", JSON.stringify(arr));
      }
    });
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
    <View style={[styles.container, themed.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.topSection}
      >
        {/* Address Bar with Reload and More buttons */}
        <View style={[styles.addressBar, themed.container]}>
          <TouchableOpacity onPress={refresh} style={themed.container}>
            <Animated.View style={[{
              transform: [{
                rotate: reloadAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }]
            }, themed.container]}>
              <Ionicons style={{
                marginLeft: 15,
                marginRight: 0,
  }} name="reload" size={16} color={theme === "dark" ? "#fff" : "#222"} />
          </Animated.View>
        </TouchableOpacity>
          
          <TextInput
            ref={inputRef}
            style={[styles.input, themed.text]}
            placeholder="Enter URL or search..."
            placeholderTextColor="#c4c4c4"
            value={url}
            onChangeText={setUrl}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setSelection({ start: 0, end: url.length })}
          />
          
          <TouchableOpacity style={[styles.sideButton, { right: 4 }]} onPress={handleMorePress}>
            <Ionicons name="ellipsis-vertical" size={18} color={theme === "dark" ? "#fff" : "#222"} />
          </TouchableOpacity>
          
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
      
      <Animated.View style={{
            opacity: findBarAnim,
        // Optionally, for slide in from top:
        transform: [{ translateY: findBarAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-30, 0]
        }) }]
      }}>
        {showFindBar && (
          <View style={{flexDirection:'row', alignItems:'center', backgroundColor:'#222', padding:6}}>
            <TextInput
              style={{flex:1, color:'#fff', backgroundColor:'#444', borderRadius:6, padding:6}}
              placeholder="Find in page..."
              placeholderTextColor="#aaa"
              value={findText}
              onChangeText={t => {
                setFindText(t);
                setFindIndex(0);
                runFindInPage(t, 0);
              }}
              autoFocus
            />
            <Text style={{color:'#fff', marginHorizontal:8}}>{findCount > 0 ? `${findIndex+1}/${findCount}` : ''}</Text>
            
            <TouchableOpacity onPress={() => {
              if(findCount > 0){
                const prev = (findIndex - 1 + findCount) % findCount;
                setFindIndex(prev);
                runFindInPage(findText, prev);
              }
            }}>
              <Ionicons name="chevron-up" size={22} color={theme === "dark" ? "#fff" : "#222"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              if(findCount > 0){
                const next = (findIndex + 1) % findCount;
                setFindIndex(next);
                runFindInPage(findText, next);
              }
            }}>
              <Ionicons name="chevron-down" size={22} color={theme === "dark" ? "#fff" : "#222"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              Animated.timing(findBarAnim, {
              toValue: 0,
              duration: 300,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }).start(() => {
              setShowFindBar(false);
              setFindText('');
              setFindIndex(0);
              setFindCount(0);
              runFindInPage('', 0);
            });
          }}>
              <Ionicons name="close" size={22} color={theme === "dark" ? "#fff" : "#222"} />
            </TouchableOpacity>
          </View>
        )}
        </Animated.View>

      {/* WebView */}
      <WebView
        onMessage={onWebViewMessage}
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
        userAgent={desktopMode ? desktopUserAgent : mobileUserAgent}
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
          <View style={[styles.menuContainer, themed.container]}>
            <ScrollView style={[styles.menuScrollView]}>
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
                    themed.text,
                    styles.menuIcon,
                    (option.id === 'back' && !canGoBack) || 
                    (option.id === 'forward' && !canGoForward) 
                      ? styles.disabledMenuText : null
                  ]}>
                    {option.icon}
                  </Text>
                  <Text style={[
                    themed.text,
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
    paddingTop: Platform.OS === 'ios' ? 50 : 25, // Account for status bar
  },
  topSection: {
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  addressBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    position: "relative",
    borderColor: "#666",
    borderRadius: 8,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: 12,
    paddingLeft: 40, // Space for reload button
    paddingRight: 40, // Space for more button
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuContainer: {
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
  },
  menuIcon: {
    fontSize: 20,
    width: 30,
    textAlign: "center",
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    flex: 1,
  },
  disabledMenuItem: {
    opacity: 0.5,
  },
  disabledMenuText: {
    color: "#888",
  },
});