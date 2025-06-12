import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import * as React from "react";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, Modal, View } from "react-native";

type ThemeType = "dark" | "light";

export default function Bookmarks() {
  const router = useRouter();
  type Bookmark = string | { url: string };
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<Bookmark[]>([]);
  const [theme, setTheme] = useState<ThemeType>("dark");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const handleMorePress = () => setShowMoreMenu(true);
  const closeMoreMenu = () => setShowMoreMenu(false);
   const menuOptions = [
    {
      id: 'Home',
      title: 'Home',
      icon: <Ionicons name="home-outline" size={22} color={theme === "dark" ? "#fff" : "#222"} />,
      action: () => { router.push("/"); setShowMoreMenu(false); },
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: <Ionicons name="settings-outline" size={22} color={theme === "dark" ? "#fff" : "#222"} />,
      action: () => { router.push("/setting"); setShowMoreMenu(false); },
    },
    {
      id: 'history',
      title: "History",
      icon: <Ionicons name="time-outline" size={22} color={theme === "dark" ? "#fff" : "#222"} />,
      action: () => { router.push("/history"); setShowMoreMenu(false); },
    },
  ];
  

  useEffect(() => {
    AsyncStorage.getItem("bookmarks").then((data) => {
      if (data) {
        try {
          const arr = JSON.parse(data);
          setBookmarks(Array.isArray(arr) ? arr : []);
          setFiltered(Array.isArray(arr) ? arr : []);
        } catch {
          setBookmarks([]);
          setFiltered([]);
        }
      }
    });
    AsyncStorage.getItem("theme").then(val => {
      if (val === "light" || val === "dark") setTheme(val);
    });
  }, []);

  useEffect(() => {
    if (!search) setFiltered(bookmarks);
    else setFiltered(
      bookmarks.filter((item) => {
        const url = typeof item === "string" ? item : item.url;
        return url.toLowerCase().includes(search.toLowerCase());
      })
    );
  }, [search, bookmarks]);

  const themed = theme === "dark" ? darkStyles : lightStyles;
  return (
    <>
      <Modal
        style={themed.container}
        visible={showMoreMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMoreMenu}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
          activeOpacity={1}
          onPress={closeMoreMenu}
        >
          <View style={{
            backgroundColor: themed.menuBg.backgroundColor,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            paddingBottom: 24,
            paddingTop: 8,
          }}>
            {menuOptions.map(option => (
              <TouchableOpacity
                key={option.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                  width: 220,
                  borderBottomWidth: 0.5,
                  borderBottomColor: themed.menuBorder.borderBottomColor,
                }}
                onPress={option.action}
              >
                <Text style={{ fontSize: 20, color: themed.menuText.color, width: 30, textAlign: "center", marginRight: 16 }}>
                  {option.icon}
                </Text>
                <Text style={{ fontSize: 16, color: themed.menuText.color, flex: 1 }}>
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      <View style={[themed.container, {
        display: 'flex',
      }]}>
        <TouchableOpacity style={{ top: 10, left: 160, marginBottom: 15, }} onPress={handleMorePress}>
            <Ionicons name="ellipsis-vertical" size={22} color={theme === "dark" ? "#fff" : "#222"} />
        </TouchableOpacity>
        <TextInput
          style={themed.input}
          placeholder="Search bookmarks..."
          placeholderTextColor={theme === "dark" ? "#aaa" : "#888"}
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => (typeof item === "string" ? item : item.url) + idx}
          renderItem={({item}) => {
                // If item is an object, use item.url; if string, use item directly (for backward compatibility)
                const url = typeof item === "string" ? item : item?.url;
                if (!url) return null;
                let display = url.replace(/^https?:\/\//, "");
                if (display.length > 15) {
                  display = display.slice(0, 12) + '...' + display.slice(-3);
                }
                return (
                  <View style={themed.row}>
                    <Text style={themed.text}>{display}</Text>
                    <TouchableOpacity
                      style={themed.openBtn}
                      onPress={() => router.push({ pathname: '/', params: { url } })}
                    >
                      <Text style={themed.openBtnText}>Open</Text>
                    </TouchableOpacity>
                  </View>
                );
            }}
          ListEmptyComponent={<Text style={themed.emptyText}>No bookmarks found.</Text>}
          />
      </View>
      </>
  );
}

const darkStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-start", alignItems: "center", backgroundColor: "#222" },
  input: { backgroundColor:'#333', color:'#fff', borderRadius:8, padding:10, margin:10, width:'90%' },
  text: { color: "#fff", fontSize: 18, padding: 10 },
  row: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', width:'100%' },
  openBtn: { backgroundColor:'#444', borderRadius:6, paddingVertical:6, paddingHorizontal:14, marginRight:10 },
  openBtnText: { color:'#fff' },
  emptyText: { color:'#aaa', marginTop:30 },
  menuBg: { backgroundColor: "#2c2c2c" },
  menuText: { color: "#fff" },
  menuBorder: { borderBottomColor: "#444" },
});
const lightStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-start", alignItems: "center", backgroundColor: "#f5f5f5" },
  input: { backgroundColor:'#fff', color:'#222', borderRadius:8, padding:10, margin:10, width:'90%' },
  text: { color: "#222", fontSize: 18, padding: 10 },
  row: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', width:'100%' },
  openBtn: { backgroundColor:'#ddd', borderRadius:6, paddingVertical:6, paddingHorizontal:14, marginRight:10 },
  openBtnText: { color:'#222' },
  emptyText: { color:'#888', marginTop:30 },
  menuBg: { backgroundColor: "#fff" },
  menuText: { color: "#222" },
  menuBorder: { borderBottomColor: "#ccc" },
});