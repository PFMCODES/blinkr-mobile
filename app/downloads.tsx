import * as React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import Index from ".";
import Settings from "./setting";

export default function Downloads() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Downloads Page</Text>
            <Button onPress={Settings} title="click me"/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#222" },
  text: { color: "#fff", fontSize: 24 }
});
