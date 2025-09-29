#!/usr/bin/env node

/**
 * Database Seeding Script for ZKode
 * Populates database with initial templates and demo data
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sample templates to seed
const templates = [
  {
    id: 'tpl_html_landing',
    name: 'Modern Landing Page',
    description: 'A clean, modern landing page with hero section and features',
    category: 'marketing',
    framework: 'html',
    features: ['responsive', 'modern-design', 'call-to-action'],
    is_featured: true,
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern Landing Page</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .hero {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: white;
        }
        .hero h1 { font-size: 3rem; margin-bottom: 1rem; }
        .hero p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
        .cta-btn {
            padding: 1rem 2rem;
            background: rgba(255,255,255,0.2);
            border: 2px solid white;
            color: white;
            text-decoration: none;
            border-radius: 50px;
            transition: all 0.3s;
        }
        .cta-btn:hover { background: white; color: #667eea; }
    </style>
</head>
<body>
    <div class="hero">
        <div>
            <h1>Welcome to the Future</h1>
            <p>Build amazing things with modern web technologies</p>
            <a href="#" class="cta-btn">Get Started</a>
        </div>
    </div>
</body>
</html>`
    }
  },
  {
    id: 'tpl_react_todo',
    name: 'React Todo App',
    description: 'A fully functional todo application built with React hooks',
    category: 'productivity',
    framework: 'react',
    features: ['hooks', 'local-storage', 'modern-react'],
    is_featured: true,
    files: {
      'App.jsx': `import React, { useState, useEffect } from 'react';

function App() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('todos');
    if (saved) setTodos(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, done: false }]);
      setInput('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Todo App</h1>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new todo..."
          style={{ flex: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button onClick={addTodo} style={{ padding: '0.5rem 1rem', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          Add
        </button>
      </div>
      <div>
        {todos.map(todo => (
          <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', border: '1px solid #eee', marginBottom: '0.5rem', borderRadius: '4px' }}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ flex: 1, textDecoration: todo.done ? 'line-through' : 'none', opacity: todo.done ? 0.6 : 1 }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)} style={{ padding: '0.25rem 0.5rem', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;`
    }
  },
  {
    id: 'tpl_vue_counter',
    name: 'Vue Counter',
    description: 'Simple counter component demonstrating Vue 3 Composition API',
    category: 'demo',
    framework: 'vue',
    features: ['composition-api', 'reactive'],
    is_featured: false,
    files: {
      'App.vue': `<template>
  <div class="counter-app">
    <h1>Vue Counter</h1>
    <div class="counter">
      <button @click="decrement" class="btn">-</button>
      <span class="count">{{ count }}</span>
      <button @click="increment" class="btn">+</button>
    </div>
    <button @click="reset" class="reset-btn">Reset</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)

const increment = () => count.value++
const decrement = () => count.value--
const reset = () => count.value = 0
</script>

<style scoped>
.counter-app {
  text-align: center;
  padding: 2rem;
  font-family: Arial, sans-serif;
}

.counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
}

.btn {
  padding: 1rem 1.5rem;
  font-size: 1.5rem;
  border: none;
  border-radius: 8px;
  background: #4f46e5;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
}

.btn:hover {
  background: #3730a3;
}

.count {
  font-size: 3rem;
  font-weight: bold;
  min-width: 4rem;
}

.reset-btn {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.reset-btn:hover {
  background: #dc2626;
}
</style>`
    }
  }
];

async function seedTemplates(env = 'dev') {
  console.log(`🌱 Seeding templates for environment: ${env}`);

  for (const template of templates) {
    try {
      console.log(`Adding template: ${template.name}`);

      const insertSQL = `
        INSERT OR REPLACE INTO templates (
          id, name, description, category, framework,
          files, features, is_featured, is_active,
          created_at, updated_at
        ) VALUES (
          '${template.id}',
          '${template.name}',
          '${template.description}',
          '${template.category}',
          '${template.framework}',
          '${JSON.stringify(template.files).replace(/'/g, "''")}',
          '${JSON.stringify(template.features).replace(/'/g, "''")}',
          ${template.is_featured ? 1 : 0},
          1,
          datetime('now'),
          datetime('now')
        );
      `;

      // Use wrangler d1 execute to run the statement
      const { spawn } = await import('child_process');

      await new Promise((resolve, reject) => {
        const child = spawn('npx', [
          'wrangler', 'd1', 'execute',
          env === 'prod' ? 'zkode-db-prod' : 'zkode-db-dev',
          '--command', insertSQL,
          '--env', env
        ], {
          stdio: 'inherit',
          shell: true
        });

        child.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Seeding failed with code ${code}`));
          }
        });
      });

      console.log(`✅ Template ${template.name} added successfully`);
    } catch (error) {
      console.error(`❌ Failed to add template ${template.name}:`, error.message);
    }
  }

  console.log('🎉 Template seeding completed!');
}

// CLI interface
const args = process.argv.slice(2);
const env = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'dev';

seedTemplates(env).catch(error => {
  console.error('Seeding failed:', error);
  process.exit(1);
});