import React, { useState, useEffect } from "react";
import "./App.css";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "./firebase";

function App() {
  const [accessToken, setAccessToken] = useState<any>();
  const [profile, setProfile] = useState<any>(null);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setAccessToken(codeResponse.access_token);
    },
    onError: (error) => console.log("Login Failed:", error),
  });

  useEffect(() => {
    if (accessToken) {
      axios
        .get(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${accessToken}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        )
        .then((res) => {
          setProfile(res.data);
          console.warn(res.data);
        })
        .catch((err) => console.log(err));
    }
  }, [accessToken]);

  // log out function to log the user out of google and set the profile array to null
  const logOut = () => {
    googleLogout();
    setProfile(null);
  };

  const [text, setText] = React.useState("");
  const [todos, setTodos] = React.useState<any[]>([]);

  const handleChangeText = React.useCallback((ev: any) => {
    setText(ev.target.value);
  }, []);

  const fetchTodos = React.useCallback(async () => {
    const q = query(
      collection(db, "users", profile.id, "todos"),
      orderBy("created", "asc")
    );

    const querySnapshot = await getDocs(q);
    setTodos(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  }, [profile]);

  React.useEffect(() => {
    if (profile) {
      fetchTodos();
    }
  }, [profile]);

  const handleAddTodo = React.useCallback(async () => {
    console.warn(text);
    await addDoc(collection(db, "users", profile.id, "todos"), {
      text,
      completed: false,
      created: Date.now(),
    });
    fetchTodos();
    setText("");
  }, [text]);

  const handleDeleteTodo = React.useCallback(
    async (todoId: string) => {
      console.warn(text);
      await deleteDoc(doc(db, "users", profile.id, "todos", todoId));
      fetchTodos();
    },
    [profile.id]
  );

  return (
    <div>
      <h2>React Google Login</h2>
      <br />
      <br />
      {profile ? (
        <div>
          <img src={profile.picture} alt="user image" />
          <h3>User Logged in</h3>
          <p>Name: {profile.name}</p>
          <p>Email Address: {profile.email}</p>
          <br />
          <br />
          <button onClick={logOut}>Log out</button>
          <br />
          <br />
          <input type="text" value={text} onChange={handleChangeText} />
          <button onClick={handleAddTodo}>Add todo</button>
          <br />
          {todos.map((todo) => (
            <div key={todo.id}>
              {todo.text}
              <button type="button" onClick={() => handleDeleteTodo(todo.id)}>
                X
              </button>
            </div>
          ))}
        </div>
      ) : (
        <button onClick={() => login()}>Sign in with Google 🚀 </button>
      )}
    </div>
  );
}
export default App;
