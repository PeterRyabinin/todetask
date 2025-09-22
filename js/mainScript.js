class TodoList {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.todoInput = document.getElementById('todoInput');
        this.todoList = document.getElementById('todoList');
        
        this.init();
    }
    
    init() {
        this.render();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Добавление по Enter
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });
    }
    
    addTodo() {
        const text = this.todoInput.value.trim();
        
        if (text === '') {
            alert('Пожалуйста, введите задачу');
            return;
        }
        
        const todo = {
            id: Date.now(),
            text: text,
            completed: false
        };
        
        this.todos.push(todo);
        this.saveToLocalStorage();
        this.render();
        this.todoInput.value = '';
        this.todoInput.focus();
    }
    
    toggleTodo(id) {
        this.todos = this.todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        
        this.saveToLocalStorage();
        this.render();
    }
    
    deleteTodo(id) {
        if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.saveToLocalStorage();
            this.render();
        }
    }
    
    saveToLocalStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
    
    render() {
        this.todoList.innerHTML = '';
        
        if (this.todos.length === 0) {
            this.todoList.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Задач пока нет</p>';
            return;
        }
        
        this.todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="todoApp.toggleTodo(${todo.id})">
                <span class="todo-text">${todo.text}</span>
                <button class="delete-btn" onclick="todoApp.deleteTodo(${todo.id})">×</button>
            `;
            
            this.todoList.appendChild(li);
        });
    }
}

// Создаем экземпляр приложения
const todoApp = new TodoList();

// Глобальная функция для HTML-атрибута
function addTodo() {
    todoApp.addTodo();
}