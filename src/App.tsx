import { useEffect, useState } from "react";
import { supabase } from "./supabase-client";

type Todo = {
  id: string;
  name: string;
  isCompleted: boolean;
};

function App() {
  const [todoList, setTodoList] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");

  const fetchTodoList = async () => {
    const { data, error } = await supabase.from("TodoList").select("*");
    if (error) {
      console.error("Error fetching todo list:", error);
    } else {
      setTodoList(data);
    }
  };

  const addTodo = async () => {
    const newTodoData = {
      name: newTodo,
      isCompleted: false,
    };
    const { data, error } = await supabase
      .from("TodoList")
      .insert([newTodoData])
      .single();

    if (error) {
      console.error("Error adding todo:", error);
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
      const updatedTodoList = todoList.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !isCompleted } : todo
      );
      setTodoList(updatedTodoList);
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
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold text-gray-100 mb-8 text-center">
          Todo List
        </h1>
        <div className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="New Todo..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-400"
          />
          <button
            onClick={addTodo}
            className="bg-blue-600 text-gray-100 px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Todo Item
          </button>
        </div>

        <ul className="space-y-4">
          {todoList.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center justify-between bg-gray-700 p-4 rounded-lg"
            >
              <p
                className={`text-lg ${
                  todo.isCompleted
                    ? "line-through text-gray-400"
                    : "text-gray-100"
                }`}
              >
                {todo.name}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => completeTask(todo.id, todo.isCompleted)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    todo.isCompleted
                      ? "bg-yellow-600 hover:bg-yellow-700 text-gray-100"
                      : "bg-green-600 hover:bg-green-700 text-gray-100"
                  }`}
                >
                  {todo.isCompleted ? "Undo" : "Complete task"}
                </button>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="bg-red-600 text-gray-100 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
