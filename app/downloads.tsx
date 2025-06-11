import * as React from "react";
import { View, Button, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Settings() {
    const router = useRouter()
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings Page</Text>
      <Button title="click me" onPress={() => router.push("/")}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#222" },
  text: { color: "#fff", fontSize: 24 }
});
