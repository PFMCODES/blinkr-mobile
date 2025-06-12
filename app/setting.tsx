import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import * as React from "react";
import { useState, useEffect } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type ThemeType = "dark" | "light";

export default function Settings() {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [theme, setTheme] = useState<ThemeType>("dark");
  const router = useRouter();

  // Load theme from storage on mount
  useEffect(() => {
    AsyncStorage.getItem("theme").then(val => {
      if (val === "light" || val === "dark") setTheme(val);
    });
  }, []);

  // Save theme to storage when changed
  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    await AsyncStorage.setItem("theme", newTheme);
  };

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
      id: 'bookmarks-2',
      title: 'See Bookmarks',
      icon: <Ionicons name="bookmarks-sharp" size={22} color={theme === "dark" ? "#fff" : "#222"} />,
      action: () => { router.push("/bookmarks"); setShowMoreMenu(false); },
    },
    {
      id: 'history',
      title: "History",
      icon: <Ionicons name="time-outline" size={22} color={theme === "dark" ? "#fff" : "#222"} />,
      action: () => { router.push("/history"); setShowMoreMenu(false); },
    },
  ];

  const clearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all browsing history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("history");
            Alert.alert("History cleared");
          },
        },
      ]
    );
  };

  const clearBookmarks = () => {
    Alert.alert(
      "Clear Bookmarks",
      "Are you sure you want to remove all bookmarks?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("bookmarks");
            Alert.alert("Bookmarks cleared");
          },
        },
      ]
    );
  };

  // Theme-based styles
  const themed = theme === "dark" ? darkStyles : lightStyles;

  return (
    <ScrollView contentContainerStyle={themed.container}>
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
            alignItems: "center"
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
      <TouchableOpacity style={{ top: -10, left: 300 }} onPress={handleMorePress}>
        <Ionicons name="ellipsis-vertical" size={22} color={theme === "dark" ? "#fff" : "#222"} />
      </TouchableOpacity>
      <Text style={themed.header}>Settings</Text>
      <TouchableOpacity style={[themed.button, { backgroundColor: "#007AFF" }]} onPress={clearHistory}>
        <Text style={themed.buttonText}>Clear History</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[themed.button, { backgroundColor: "#007AFF" }]} onPress={clearBookmarks}>
        <Text style={themed.buttonText}>Clear Bookmarks</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[themed.button, { backgroundColor: "#444" }]} onPress={toggleTheme}>
        <Text style={themed.buttonText}>
          Switch to {theme === "dark" ? "Light" : "Dark"} Mode
        </Text>
      </TouchableOpacity>
      <View style={themed.section}>
        <Text style={themed.sectionTitle}>About</Text>
        <Text style={themed.aboutText}>Blinkr Mobile</Text>
        <Text style={themed.aboutText}>Version 1.0.0</Text>
        <Text style={themed.aboutText}>© 2025 PFMCODES</Text>
      </View>
    </ScrollView>
  );
}

// Dark theme styles
const darkStyles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#222", padding: 24 },
  header: { color: "#fff", fontSize: 58, fontWeight: 'bold', marginBottom: 30 },
  button: { borderRadius: 8, paddingVertical: 14, marginVertical: 10, width: 240, alignItems: 'center' },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: '600' },
  section: { marginTop: 40, alignItems: 'center' },
  sectionTitle: { color: '#aaa', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  aboutText: { color: '#aaa', fontSize: 15, marginBottom: 2 },
  menuBg: { backgroundColor: "#2c2c2c" },
  menuText: { color: "#fff" },
  menuBorder: { borderBottomColor: "#444" },
});

// Light theme styles
const lightStyles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#f5f5f5", padding: 24 },
  header: { color: "#000", fontSize: 58, fontWeight: 'bold', marginBottom: 30 },
  button: { borderRadius: 8, paddingVertical: 14, marginVertical: 10, width: 240, alignItems: 'center' },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: '600' },
  section: { marginTop: 40, alignItems: 'center' },
  sectionTitle: { color: '#555', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  aboutText: { color: '#555', fontSize: 15, marginBottom: 2 },
  menuBg: { backgroundColor: "#fff" },
  menuText: { color: "#222" },
  menuBorder: { borderBottomColor: "#ccc" },
});