import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import * as React from "react";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function History() {
  const router = useRouter();
  const [history, setHistory] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem("history").then((data) => {
      if (data) {
        try {
          const arr = JSON.parse(data);
          setHistory(Array.isArray(arr) ? arr : []);
          setFiltered(Array.isArray(arr) ? arr : []);
        } catch {
          setHistory([]);
          setFiltered([]);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!search) setFiltered(history);
    else setFiltered(history.filter((item) => item.toLowerCase().includes(search.toLowerCase())));
  }, [search, history]);

  return (
    <View style={styles.container}>
      <TextInput
        style={{backgroundColor:'#333', color:'#fff', borderRadius:8, padding:10, margin:10, width:'90%'}}
        placeholder="Search history..."
        placeholderTextColor="#aaa"
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item, idx) => item + idx}
        renderItem={({item}) => {
            let display = item;
            display = item.replace(/^https?:\/\//, "");
            if (display.length > 15) {
            display = display.slice(0, 12) + '...' + display.slice(-3);
            }
            return (
            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', width:'100%'}}>
                <Text style={styles.text}>{display}</Text>
                <TouchableOpacity
                style={{backgroundColor:'#444', borderRadius:6, paddingVertical:6, paddingHorizontal:14, marginRight:10}}
                onPress={() => router.push({ pathname: '/', params: { url: item } })}
                >
                <Text style={{color:'#fff'}}>Open</Text>
                </TouchableOpacity>
            </View>
            );
        }}
        ListEmptyComponent={<Text style={{color:'#aaa', marginTop:30}}>No history found.</Text>}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "flex-start", alignItems: "center", backgroundColor: "#222" },
  text: { color: "#fff", fontSize: 18, padding: 10 }
});