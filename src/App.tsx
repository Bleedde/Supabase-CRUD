import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Background } from "./components/Background.";
import { supabase } from "./supabase-client";

type Todo = {
  id: string;
  name: string;
  isCompleted: boolean;
};

function App() {
  const [todoList, setTodoList] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const fetchTodoList = async () => {
    if (!session) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from("TodoList")
      .select("*")
      .eq("userId", session.user.id);

    if (error) {
      console.error("Error fetching todo list:", error);
    } else {
      setTodoList(data);
    }
    setIsLoading(false);
  };

  const addTodo = async () => {
    if (!session) return;

    const newTodoData = {
      name: newTodo,
      isCompleted: false,
      userId: session.user.id,
    };

    const { data, error } = await supabase
      .from("TodoList")
      .insert([newTodoData])
      .select("*")
      .single();

    if (error) {
      console.log("Error adding todo: ", error);
    } else {
      setTodoList((prev) => [...prev, data]);
      setNewTodo("");
    }
  };

  const completeTask = async (id: string, isCompleted: boolean) => {
    const { error } = await supabase
      .from("TodoList")
      .update({ isCompleted: !isCompleted })
      .eq("id", id);

    if (error) {
      console.error("Error completing task:", error);
    } else {
      setTodoList((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, isCompleted: !isCompleted } : todo
        )
      );
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase.from("TodoList").delete().eq("id", id);
    if (error) {
      console.error("Error deleting todo:", error);
    } else {
      setTodoList((prev) => prev.filter((todo) => todo.id !== id));
    }
  };

  useEffect(() => {
    fetchTodoList();
  }, [session]);

  console.log(session);

  return (
    <div className="h-screen w-screen">
      <Background />
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-3 border-white">
            loading...
          </div>
        </div>
      ) : session ? (
        <div className="h-screen flex flex-col items-center justify-center py-8 px-4 relative">
          <h1 className="text-white text-2xl font-bold text-center">
            Welcome {session.user.user_metadata.full_name}!
          </h1>
          <img
            src={session.user.user_metadata.avatar_url}
            alt="avatar"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mt-3 mb-5"
          />
          <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-6 sm:mb-8 text-center">
              Todo List
            </h1>
            <div className="flex flex-col sm:flex-row gap-2 mb-6 sm:mb-8">
              <input
                type="text"
                placeholder="New Todo..."
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                className="w-full flex-1 px-4 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-400"
              />
              <button
                onClick={addTodo}
                disabled={newTodo === ""}
                className="w-full sm:w-auto cursor-pointer bg-blue-600 text-gray-100 px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Todo Item
              </button>
            </div>
            <ul className="space-y-4 h-[400px] max-h-[400px] overflow-y-auto">
              {todoList.map((todo) => (
                <li
                  key={todo.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-700 p-4 rounded-lg gap-3"
                >
                  <p
                    className={`text-lg truncate max-w-full sm:max-w-[300px] ${
                      todo.isCompleted
                        ? "line-through text-gray-400"
                        : "text-gray-100"
                    }`}
                  >
                    {todo.name}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => completeTask(todo.id, todo.isCompleted)}
                      className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors ${
                        todo.isCompleted
                          ? "bg-yellow-600 hover:bg-yellow-700 text-gray-100"
                          : "bg-green-600 hover:bg-green-700 text-gray-100"
                      }`}
                    >
                      {todo.isCompleted ? "Undo" : "Complete task"}
                    </button>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="w-full sm:w-auto bg-red-600 text-gray-100 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={signOut}
            className="cursor-pointer mt-4 bg-purple-800 text-gray-100 px-6 py-2 rounded-lg hover:bg-purple-700 transition-color"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div className="h-screen w-screen flex flex-col items-center justify-center py-8 px-4">
          <button
            onClick={signUp}
            className="flex items-center gap-3 bg-white text-white-700 hover:bg-gray-200 transition-colors px-6 py-3 rounded-lg shadow-lg font-semibold cursor-pointer relative"
          >
            <img
              src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
              alt="Google logo"
              className="w-6 h-6"
            />
            Sign in with Google
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
