// 桌面宠物核心逻辑 - Mochi 升级版（带记忆功能）
class DesktopPet {
    constructor() {
        this.petContainer = document.getElementById('pet-container');
        this.chatBubble = document.getElementById('chat-bubble');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.typingIndicator = document.getElementById('typing');
        this.petStatus = document.getElementById('pet-status');
        this.emotionIndicator = document.getElementById('emotion');
        
        this.isDragging = false;
        this.isChatOpen = false;
        this.dragOffset = { x: 0, y: 0 };
        this.currentX = window.innerWidth - 84;
        this.currentY = window.innerHeight - 84;
        
        // 宠物状态
        this.state = 'idle';
        this.ownerName = localStorage.getItem('mochi_owner_name') || '';
        this.isFirstTime = !localStorage.getItem('mochi_visited');
        this.tutorialCompleted = localStorage.getItem('mochi_tutorial') === 'true';
        
        // 对话记忆（保存最近10轮对话）
        this.conversationHistory = JSON.parse(localStorage.getItem('mochi_history') || '[]');
        this.maxHistoryLength = 10;
        
        // 自言自语计时器
        this.lastInteractionTime = Date.now();
        
        this.emotions = {
            happy: '😸',
            sad: '😿',
            surprised: '🙀',
            love: '😻',
            sleepy: '😴',
            hungry: '🤤',
            normal: ''
        };
        
        // 头顶飘动的可爱文字（20种）
        this.floatTexts = [
            '你可以摸摸我咩~',
            '我好喜欢你呀~',
            '你喜欢我咩？',
            '陪我玩好不好~',
            '我想吃小鱼干~',
            '抱抱我嘛~',
            '你在忙什么呢？',
            '我好想你呀~',
            '今天开心吗？',
            '不要工作太久哦',
            '摸摸我的头~',
            '和我聊聊天吧~',
            '我好无聊呀~',
            '你在想什么呢？',
            '我会一直陪着你的~',
            '你最好了~',
            '我想睡觉觉了~',
            '给我好吃的嘛~',
            '我好幸福呀~',
            '喵~ 爱你哟~'
        ];
        
        // 自言自语的话
        this.mumblings = {
            idle: [
                '喵~ 好无聊呀...',
                '今天天气真不错~',
                '想吃点小鱼干...',
                '主人去哪了呢？',
                '这个角落好舒服~',
                '伸个懒腰~',
                '打哈欠...好困呀',
                '想玩毛线球...',
                '太阳晒得好暖和~',
                '外面有什么声音？',
                '想睡觉觉了...',
                '肚子咕咕叫...',
                '主人什么时候回来呢？',
                '好安静呀...',
                '想被摸摸头...'
            ],
            withOwner: [
                '{name}，你在忙什么呢？',
                '{name}，陪我玩嘛~',
                '{name}，我好喜欢你呀~',
                '{name}，今天开心吗？',
                '{name}，不要工作太久哦',
                '{name}，我想吃鱼鱼~',
                '{name}，抱抱~',
                '{name}，你在想什么呢？',
                '{name}，我好幸福呀~',
                '{name}，你会一直陪着我吗？'
            ],
            sleepy: [
                '好困...想睡觉...',
                '眼皮好重...',
                'zzz...',
                '打个盹...',
                '月亮出来了...',
                '夜深人静...',
                '好晚了...还不睡吗？'
            ],
            hungry: [
                '肚子饿了...',
                '想吃小鱼干...',
                '有没有好吃的？',
                '喵~ 饿饿...',
                '想吃东西...'
            ],
            playful: [
                '想玩！想玩！',
                '来玩捉迷藏吧！',
                '追我呀~',
                '好无聊，陪我玩嘛',
                '我想跑酷！'
            ]
        };
        
        // 飘动文字计时器
        this.floatTextTimer = null;
        
        this.init();
    }
    
    init() {
        this.setupDragAndDrop();
        this.setupChat();
        this.setupPetInteractions();
        this.setupAutoWalk();
        this.setupMumbling();
        this.setupSleepSchedule();
        this.setupRandomActions();
        this.setupFloatText(); // 添加飘动文字
        
        // 设置初始位置
        this.updatePosition();
        
        // 首次访问或问候
        setTimeout(() => {
            if (this.isFirstTime) {
                this.showFirstTimeGreeting();
            } else if (!this.tutorialCompleted && this.ownerName) {
                this.showTutorial();
            } else if (this.ownerName) {
                this.showGreetingWithName();
            } else {
                this.showStatus('点击我聊天~');
            }
        }, 1000);
        
        // 标记已访问
        localStorage.setItem('mochi_visited', 'true');
    }
    
    // 头顶飘动文字
    setupFloatText() {
        const showFloatText = () => {
            if (this.isChatOpen || this.isDragging || this.state === 'sleeping') {
                this.floatTextTimer = setTimeout(showFloatText, 5000);
                return;
            }
            
            // 随机选择一条文字
            let text = this.floatTexts[Math.floor(Math.random() * this.floatTexts.length)];
            
            // 如果有名字，替换部分文字
            if (this.ownerName && Math.random() < 0.5) {
                const nameTexts = [
                    `${this.ownerName}，你可以摸摸我咩~`,
                    `${this.ownerName}，我好喜欢你呀~`,
                    `${this.ownerName}，你喜欢我咩？`,
                    `${this.ownerName}，陪我玩好不好~`,
                    `${this.ownerName}，我好想你呀~`,
                    `${this.ownerName}，今天开心吗？`,
                    `${this.ownerName}，不要工作太久哦`,
                    `${this.ownerName}，抱抱我嘛~`,
                    `${this.ownerName}，你最好了~`,
                    `${this.ownerName}，喵~ 爱你哟~`
                ];
                text = nameTexts[Math.floor(Math.random() * nameTexts.length)];
            }
            
            this.showFloatTextBubble(text);
            
            // 随机间隔 8-15 秒
            const nextTime = Math.random() * 7000 + 8000;
            this.floatTextTimer = setTimeout(showFloatText, nextTime);
        };
        
        // 延迟5秒后开始
        this.floatTextTimer = setTimeout(showFloatText, 5000);
    }
    
    // 显示飘动文字气泡
    showFloatTextBubble(text) {
        // 移除旧的
        const oldFloat = this.petContainer.querySelector('.float-text');
        if (oldFloat) oldFloat.remove();
        
        // 创建新的
        const floatDiv = document.createElement('div');
        floatDiv.className = 'float-text';
        floatDiv.textContent = text;
        this.petContainer.appendChild(floatDiv);
        
        // 3秒后移除
        setTimeout(() => {
            if (floatDiv.parentNode) {
                floatDiv.remove();
            }
        }, 3000);
    }
    
    // 保存对话历史
    saveConversation(userMessage, petResponse) {
        this.conversationHistory.push({
            user: userMessage,
            pet: petResponse,
            time: Date.now()
        });
        
        // 只保留最近10轮
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
        
        localStorage.setItem('mochi_history', JSON.stringify(this.conversationHistory));
    }
    
    // 获取对话上下文（用于AI）
    getConversationContext() {
        if (this.conversationHistory.length === 0) return '';
        
        let context = '之前的对话记录：\n';
        this.conversationHistory.slice(-5).forEach((item, index) => {
            context += `${index + 1}. 用户：${item.user}\n`;
            context += `   Mochi：${item.pet}\n`;
        });
        context += '\n请根据以上对话上下文，保持连贯性回复。\n';
        return context;
    }
    
    // 首次访问问候 - 只问名字，不问其他
    showFirstTimeGreeting() {
        this.openChat();
        setTimeout(() => {
            this.addMessage('喵~ 你好！我叫 Mochi 🐱', false);
            setTimeout(() => {
                this.addMessage('你想让我怎么称呼你呢？（直接告诉我你的名字就好）', false);
            }, 1200);
        }, 500);
    }
    
    // 教程对话 - 在用户输入名字后调用
    showTutorial() {
        this.openChat();
        
        const tutorialSteps = [
            { msg: `${this.ownerName}，让我来教你如何使用我吧~`, delay: 500 },
            { msg: '1️⃣ 单击我可以打开聊天窗口，和我聊天哦', delay: 2500 },
            { msg: '2️⃣ 双击我可以摸摸我，我会很开心~', delay: 4500 },
            { msg: '3️⃣ 右键点击我可以给我喂食', delay: 6500 },
            { msg: '4️⃣ 拖拽我可以移动位置', delay: 8500 },
            { msg: '5️⃣ 深夜我会自动睡觉，你也可以点击我唤醒我', delay: 10500 },
            { msg: '我会记住我们的对话，保持连贯性哦~', delay: 12500 },
            { msg: '现在你可以试试和我聊天啦！', delay: 14500 }
        ];
        
        tutorialSteps.forEach(step => {
            setTimeout(() => {
                this.addMessage(step.msg, false);
            }, step.delay);
        });
        
        // 标记教程完成
        setTimeout(() => {
            localStorage.setItem('mochi_tutorial', 'true');
            this.tutorialCompleted = true;
        }, 15500);
    }
    
    // 带有名字的问候
    showGreetingWithName() {
        const hour = new Date().getHours();
        let greeting = '';
        
        if (hour >= 5 && hour < 12) {
            greeting = '早安';
        } else if (hour >= 12 && hour < 14) {
            greeting = '中午好';
        } else if (hour >= 14 && hour < 18) {
            greeting = '下午好';
        } else if (hour >= 18 && hour < 22) {
            greeting = '晚上好';
        } else {
            greeting = '这么晚还不睡呀';
        }
        
        // 检查是否有之前的对话
        const hasHistory = this.conversationHistory.length > 0;
        const lastTopic = hasHistory ? this.conversationHistory[this.conversationHistory.length - 1].user : null;
        
        let messages;
        if (hasHistory && lastTopic) {
            // 延续之前的话题
            messages = [
                `${greeting}，${this.ownerName}！`,
                `${this.ownerName}，上次我们聊到"${lastTopic.substring(0, 10)}..."，还想继续聊吗？`,
                `${this.ownerName}，我好想你呀~ 还记得我们上次聊的内容吗？`,
                `喵~ ${this.ownerName}，欢迎回来！我在等你呢~`
            ];
        } else {
            messages = [
                `${greeting}，${this.ownerName}！`,
                `${this.ownerName}，我好想你呀~`,
                `喵~ ${this.ownerName}，今天想聊点什么？`,
                `${this.ownerName}，你可以摸摸我哦~`
            ];
        }
        
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        this.showStatus(randomMsg);
    }
    
    // 自言自语功能
    setupMumbling() {
        const randomInterval = () => Math.random() * 15000 + 15000;
        
        const mumble = () => {
            if (this.isChatOpen || this.isDragging || this.state === 'sleeping') {
                setTimeout(mumble, randomInterval());
                return;
            }
            
            const timeSinceLastInteraction = Date.now() - this.lastInteractionTime;
            const isIdle = timeSinceLastInteraction > 30000;
            
            let mumblingList;
            const hour = new Date().getHours();
            
            if (hour >= 23 || hour < 6) {
                mumblingList = this.mumblings.sleepy;
            } else if (isIdle && this.ownerName) {
                mumblingList = this.mumblings.withOwner.map(m => m.replace('{name}', this.ownerName));
            } else {
                mumblingList = this.mumblings.idle;
            }
            
            const message = mumblingList[Math.floor(Math.random() * mumblingList.length)];
            this.showStatus(message);
            
            if (Math.random() < 0.3) {
                this.doRandomAction();
            }
            
            setTimeout(mumble, randomInterval());
        };
        
        setTimeout(mumble, randomInterval());
    }
    
    // 睡觉时间表
    setupSleepSchedule() {
        setInterval(() => {
            const hour = new Date().getHours();
            
            if ((hour >= 23 || hour < 7) && !this.isChatOpen && !this.isDragging) {
                if (this.state !== 'sleeping' && Math.random() < 0.3) {
                    this.goToSleep();
                }
            }
            else if (hour >= 7 && hour < 23 && this.state === 'sleeping') {
                this.wakeUp();
            }
        }, 60000);
    }
    
    goToSleep() {
        this.state = 'sleeping';
        this.petContainer.className = 'sleeping-animation';
        this.showEmotion('sleepy');
        this.showStatus('zzz... 我要睡觉了...');
        
        let sleepIcon = document.getElementById('sleep-icon');
        if (!sleepIcon) {
            sleepIcon = document.createElement('div');
            sleepIcon.id = 'sleep-icon';
            sleepIcon.style.cssText = 'position:absolute;top:-25px;right:-5px;font-size:20px;animation:float 2s ease-in-out infinite;pointer-events:none;';
            this.petContainer.appendChild(sleepIcon);
        }
        sleepIcon.textContent = '💤';
    }
    
    wakeUp() {
        this.state = 'idle';
        this.petContainer.className = 'idle-animation';
        this.showEmotion('normal');
        this.showStatus('喵~ 起床啦！');
        
        const sleepIcon = document.getElementById('sleep-icon');
        if (sleepIcon) {
            sleepIcon.remove();
        }
    }
    
    // 随机动作
    setupRandomActions() {
        setInterval(() => {
            if (this.isChatOpen || this.isDragging || this.state === 'sleeping') return;
            
            if (Math.random() < 0.2) {
                this.doRandomAction();
            }
        }, 10000);
    }
    
    doRandomAction() {
        const actions = ['stretch', 'yawn', 'shake', 'lookAround'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        switch(action) {
            case 'stretch':
                this.stretch();
                break;
            case 'yawn':
                this.yawn();
                break;
            case 'shake':
                this.shake();
                break;
            case 'lookAround':
                this.lookAround();
                break;
        }
    }
    
    stretch() {
        this.state = 'stretching';
        this.petContainer.className = 'stretching-animation';
        this.showStatus('伸个懒腰~ 好舒服~');
        
        setTimeout(() => {
            this.state = 'idle';
            this.petContainer.className = 'idle-animation';
        }, 2000);
    }
    
    yawn() {
        this.showEmotion('sleepy');
        this.showStatus('哈~ 欠~ 好困呀...');
        
        setTimeout(() => {
            this.showEmotion('normal');
        }, 2000);
    }
    
    shake() {
        this.petContainer.className = 'shaking-animation';
        this.showStatus('抖抖抖~');
        
        setTimeout(() => {
            this.petContainer.className = 'idle-animation';
        }, 1000);
    }
    
    lookAround() {
        this.showStatus('那边有什么？');
        this.petContainer.style.transform = 'scaleX(-1)';
        
        setTimeout(() => {
            this.petContainer.style.transform = 'scaleX(1)';
        }, 1500);
    }
    
    setupDragAndDrop() {
        this.dragStarted = false;
        
        this.petContainer.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStarted = false;
            this.lastInteractionTime = Date.now();
            this.petContainer.classList.add('dragging');
            this.dragOffset.x = e.clientX - this.currentX;
            this.dragOffset.y = e.clientY - this.currentY;
            
            if (this.state === 'sleeping') {
                this.wakeUp();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            e.preventDefault();
            this.dragStarted = true; // 标记为正在拖动
            this.currentX = e.clientX - this.dragOffset.x;
            this.currentY = e.clientY - this.dragOffset.y;
            
            this.currentX = Math.max(0, Math.min(window.innerWidth - 64, this.currentX));
            this.currentY = Math.max(0, Math.min(window.innerHeight - 64, this.currentY));
            
            this.updatePosition();
            this.updateChatPosition();
            
            // 更新右键菜单位置（如果显示中）
            updateContextMenuPosition();
            
            // 更新所有可拖动元素位置（连带拖动）
            updateDraggablePositions();
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.lastInteractionTime = Date.now();
                this.petContainer.classList.remove('dragging');
                
                // 延迟重置 dragStarted，避免 click 事件误判
                setTimeout(() => {
                    this.dragStarted = false;
                }, 50);
            }
        });
    }
    
    updatePosition() {
        this.petContainer.style.left = this.currentX + 'px';
        this.petContainer.style.top = this.currentY + 'px';
        this.petContainer.style.right = 'auto';
        this.petContainer.style.bottom = 'auto';
    }
    
    updateChatPosition() {
        if (this.isChatOpen) {
            // 对话框固定显示在猫咪左上角
            let chatLeft = this.currentX - 290; // 猫咪左侧
            let chatTop = this.currentY - 280;  // 猫咪上方
            
            // 确保不超出屏幕边界
            if (chatLeft < 10) {
                chatLeft = 10;
            }
            if (chatTop < 10) {
                chatTop = this.currentY + 70; // 如果上方空间不够，显示在下方
            }
            
            this.chatBubble.style.left = chatLeft + 'px';
            this.chatBubble.style.top = chatTop + 'px';
            this.chatBubble.style.right = 'auto';
            this.chatBubble.style.bottom = 'auto';
        }
    }
    
    setupChat() {
        // 单击打开对话框
        this.petContainer.addEventListener('click', (e) => {
            // 如果正在拖动，不打开对话框
            if (this.isDragging) return;
            
            // 判断是单击还是拖动结束
            if (!this.dragStarted) {
                this.lastInteractionTime = Date.now();
                this.toggleChat();
            }
        });
        
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.lastInteractionTime = Date.now();
                sendMessage();
            }
        });
        
        // 设置对话框拖动（与小猫联动）
        this.setupChatDrag();
    }
    
    setupChatDrag() {
        const chatHeader = this.chatBubble.querySelector('.chat-header');
        if (!chatHeader) return;
        
        let isChatDragging = false;
        let chatDragOffset = { x: 0, y: 0 };
        
        chatHeader.style.cursor = 'move';
        
        chatHeader.addEventListener('mousedown', (e) => {
            isChatDragging = true;
            chatDragOffset.x = e.clientX - this.chatBubble.offsetLeft;
            chatDragOffset.y = e.clientY - this.chatBubble.offsetTop;
            this.chatBubble.style.transition = 'none';
            this.petContainer.classList.add('dragging');
            
            if (this.state === 'sleeping') {
                this.wakeUp();
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isChatDragging) return;
            
            e.preventDefault();
            
            // 计算对话框新位置
            let newChatX = e.clientX - chatDragOffset.x;
            let newChatY = e.clientY - chatDragOffset.y;
            
            // 限制在屏幕内
            newChatX = Math.max(0, Math.min(window.innerWidth - this.chatBubble.offsetWidth, newChatX));
            newChatY = Math.max(0, Math.min(window.innerHeight - this.chatBubble.offsetHeight, newChatY));
            
            // 更新对话框位置
            this.chatBubble.style.left = newChatX + 'px';
            this.chatBubble.style.top = newChatY + 'px';
            this.chatBubble.style.right = 'auto';
            this.chatBubble.style.bottom = 'auto';
            
            // 同步更新小猫位置（保持相对位置）
            // 对话框在小猫左上角，所以小猫在对话框右下方
            this.currentX = newChatX + 290;
            this.currentY = newChatY + 280;
            
            // 限制小猫在屏幕内
            this.currentX = Math.max(0, Math.min(window.innerWidth - 64, this.currentX));
            this.currentY = Math.max(0, Math.min(window.innerHeight - 64, this.currentY));
            
            this.updatePosition();
        });
        
        document.addEventListener('mouseup', () => {
            if (isChatDragging) {
                isChatDragging = false;
                this.chatBubble.style.transition = '';
                this.petContainer.classList.remove('dragging');
                this.lastInteractionTime = Date.now();
            }
        });
    }
    
    openChat() {
        if (!this.isChatOpen) {
            this.isChatOpen = true;
            this.lastInteractionTime = Date.now();
            this.chatBubble.style.display = 'block';
            this.updateChatPosition();
            this.chatInput.focus();
            this.showEmotion('happy');
            
            if (this.state === 'sleeping') {
                this.wakeUp();
            }
        }
    }
    
    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        if (this.isChatOpen) {
            this.chatBubble.style.display = 'block';
            this.updateChatPosition();
            this.chatInput.focus();
            this.showEmotion('happy');
            
            if (this.state === 'sleeping') {
                this.wakeUp();
            }
        } else {
            this.chatBubble.style.display = 'none';
            this.showEmotion('normal');
        }
    }
    
    setupAutoWalk() {
        setInterval(() => {
            if (this.isDragging || this.isChatOpen || this.state === 'sleeping') return;
            
            if (Math.random() < 0.2) {
                this.walkToRandomPosition();
            }
        }, 8000);
    }
    
    walkToRandomPosition() {
        if (this.state === 'walking') return;
        
        this.state = 'walking';
        this.petContainer.className = 'walking-animation';
        
        const targetX = Math.random() * (window.innerWidth - 100) + 20;
        const targetY = Math.random() * (window.innerHeight - 100) + 20;
        
        const speed = 1.5;
        const dx = targetX - this.currentX;
        const dy = targetY - this.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / speed);
        
        let step = 0;
        const walkStep = () => {
            if (this.isDragging || this.isChatOpen || step >= steps) {
                this.state = 'idle';
                this.petContainer.className = 'idle-animation';
                return;
            }
            
            this.currentX += dx / steps;
            this.currentY += dy / steps;
            this.updatePosition();
            step++;
            
            requestAnimationFrame(walkStep);
        };
        
        walkStep();
    }
    
    setupPetInteractions() {
        // 右键菜单
        this.petContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.lastInteractionTime = Date.now();
            showContextMenu(e.clientX, e.clientY);
        });
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                hideContextMenu();
            }
        });
    }
    
    // 摸摸功能
    petMe() {
        this.lastInteractionTime = Date.now();
        this.petContainer.classList.add('click-animation');
        this.showEmotion('love');
        
        const petMessages = this.ownerName ?
            [`喵~ ${this.ownerName}，好舒服！`, `${this.ownerName}，你最好了！`, '好喜欢你呀~', `${this.ownerName}，摸摸头~`] :
            ['喵~ 好舒服！', '你最好了！', '好喜欢你呀~', '摸摸头~'];
        
        this.showStatus(petMessages[Math.floor(Math.random() * petMessages.length)]);
        
        if (this.state === 'sleeping') {
            this.wakeUp();
        }
        
        setTimeout(() => {
            this.petContainer.classList.remove('click-animation');
            this.showEmotion('normal');
        }, 1000);
    }
    
    feedPet() {
        this.state = 'eating';
        this.showEmotion('happy');
        
        const feedMessages = this.ownerName ?
            [`${this.ownerName}，好好吃！谢谢你~`, '喵~ 真美味！', '最喜欢你啦！'] :
            ['好好吃！谢谢你~', '喵~ 真美味！', '好开心！'];
        
        this.showStatus(feedMessages[Math.floor(Math.random() * feedMessages.length)]);
        
        if (this.state === 'sleeping') {
            this.wakeUp();
        }
        
        setTimeout(() => {
            this.state = 'idle';
            this.showEmotion('normal');
        }, 3000);
    }
    
    showStatus(message) {
        this.petStatus.textContent = message;
        this.petStatus.classList.add('show');
        setTimeout(() => {
            this.petStatus.classList.remove('show');
        }, 4000);
    }
    
    showEmotion(emotion) {
        this.emotionIndicator.textContent = this.emotions[emotion] || '';
    }
    
    addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'pet'}`;
        messageDiv.textContent = text;
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    showTyping() {
        this.typingIndicator.classList.add('show');
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    hideTyping() {
        this.typingIndicator.classList.remove('show');
    }
    
    setOwnerName(name) {
        this.ownerName = name;
        localStorage.setItem('mochi_owner_name', name);
    }
}

// 初始化宠物
const pet = new DesktopPet();

// 全局函数
function closeChat() {
    pet.toggleChat();
}

function sendMessage() {
    const message = pet.chatInput.value.trim();
    if (!message) return;
    
    pet.lastInteractionTime = Date.now();
    
    // 检查是否是设置名字（首次访问时）- 更简单直接的判断
    if (!pet.ownerName && pet.isFirstTime && message.length <= 10 && !message.includes('？') && !message.includes('?')) {
        const name = message.replace(/[，,。！!]/g, '').trim();
        if (name.length > 0 && name.length <= 8) {
            pet.setOwnerName(name);
            pet.addMessage(message, true);
            pet.chatInput.value = '';
            
            setTimeout(() => {
                pet.addMessage(`好的，${name}！以后我就这么称呼你啦~`, false);
                setTimeout(() => {
                    pet.addMessage(`我是你的桌面宠物，以后我会一直陪着你哦~`, false);
                    // 触发教程
                    setTimeout(() => {
                        pet.showTutorial();
                    }, 1500);
                }, 1500);
            }, 500);
            return;
        }
    }
    
    // 普通消息
    pet.addMessage(message, true);
    pet.chatInput.value = '';
    pet.showTyping();
    getAIResponse(message);
}

// 获取天气信息（使用免费API）
async function getWeatherInfo(city) {
    try {
        // 使用 Open-Meteo 免费天气API（无需API Key）
        // 先获取城市坐标
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`);
        const geoData = await geoResponse.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            return null;
        }
        
        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;
        
        // 获取天气数据
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`);
        const weatherData = await weatherResponse.json();
        
        const temp = Math.round(weatherData.current.temperature_2m);
        const weatherCode = weatherData.current.weather_code;
        
        // 天气代码转中文
        const weatherMap = {
            0: '晴天', 1: '多云', 2: '多云', 3: '阴天',
            45: '雾', 48: '雾凇',
            51: '小雨', 53: '中雨', 55: '大雨',
            56: '冻雨', 57: '冻雨',
            61: '小雨', 63: '中雨', 65: '大雨',
            66: '冻雨', 67: '冻雨',
            71: '小雪', 73: '中雪', 75: '大雪',
            77: '雪粒',
            80: '阵雨', 81: '阵雨', 82: '暴雨',
            85: '阵雪', 86: '阵雪',
            95: '雷雨', 96: '雷雹', 99: '雷雹'
        };
        
        const condition = weatherMap[weatherCode] || '未知';
        
        return {
            city: location.name || city,
            condition: condition,
            temperature: temp + '°C'
        };
    } catch (error) {
        console.error('获取天气失败:', error);
        return null;
    }
}

// 获取日历信息
function getCalendarInfo() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const day = dayNames[now.getDay()];
    
    // 农历转换（简化版）
    const lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
    const lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                       '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                       '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
    
    // 简化的农历计算（实际应该用更复杂的算法或API）
    const lunarMonth = lunarMonths[(month + 9) % 12];
    const lunarDay = lunarDays[(date - 1) % 30];
    
    // 获取节日
    const festivals = getFestivals(month, date);
    
    return {
        year,
        month,
        date,
        day,
        lunar: `农历${lunarMonth}月${lunarDay}`,
        festivals: festivals,
        time: now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    };
}

// 获取节日
function getFestivals(month, date) {
    const festivals = {
        '1-1': '元旦',
        '2-14': '情人节',
        '3-8': '妇女节',
        '4-1': '愚人节',
        '5-1': '劳动节',
        '6-1': '儿童节',
        '7-1': '建党节',
        '8-1': '建军节',
        '9-10': '教师节',
        '10-1': '国庆节',
        '12-25': '圣诞节'
    };
    
    const key = `${month}-${date}`;
    return festivals[key] || null;
}

// 检查是否是天气查询
function isWeatherQuery(message) {
    const weatherKeywords = ['天气', '气温', '下雨', '晴天', '多云', '雾霾', '温度'];
    return weatherKeywords.some(keyword => message.includes(keyword));
}

// 检查是否是日历查询
function isCalendarQuery(message) {
    const calendarKeywords = ['日历', '日期', '今天几号', '星期几', '农历', '节日', '几月几号'];
    return calendarKeywords.some(keyword => message.includes(keyword));
}

// 提取城市名
function extractCity(message) {
    // 简单的城市提取逻辑
    const cityMatch = message.match(/(.+?)(的|今天|明天|后天)?天气/);
    if (cityMatch && cityMatch[1]) {
        const city = cityMatch[1].replace(/(今天|明天|后天|查询|查看)/g, '').trim();
        if (city && city.length > 1 && city.length < 10) {
            return city;
        }
    }
    return '北京'; // 默认城市
}

// AI聊天功能（带记忆）
async function getAIResponse(userMessage) {
    try {
        let response;
        
        // 检查是否是天气查询
        if (isWeatherQuery(userMessage)) {
            const city = extractCity(userMessage);
            pet.showTyping();
            const weather = await getWeatherInfo(city);
            
            if (weather) {
                // 可爱的天气回复
                const cuteResponses = [
                    `喵~ ${weather.city}现在是${weather.condition}，${weather.temperature}呢！`,
                    `${weather.city}的天气是${weather.condition}，${weather.temperature}喵~`,
                    `喵喵~ ${weather.city}今天${weather.condition}，气温${weather.temperature}，要穿暖暖哦！`,
                    `${weather.city}现在是${weather.condition}，${weather.temperature}，出门记得带伞喵~`
                ];
                // 根据天气状况选择更贴切的回复
                if (weather.condition.includes('雨')) {
                    response = `${weather.city}在下雨呢，${weather.temperature}，记得带伞喵~ 🌧️`;
                } else if (weather.condition.includes('雪')) {
                    response = `${weather.city}下雪啦！${weather.temperature}，好冷呀要穿暖暖喵~ ❄️`;
                } else if (weather.condition.includes('晴')) {
                    response = `${weather.city}是晴天呢，${weather.temperature}，适合出去玩喵~ ☀️`;
                } else if (weather.condition.includes('云')) {
                    response = `${weather.city}多云，${weather.temperature}，天气不错喵~ ⛅`;
                } else {
                    response = cuteResponses[Math.floor(Math.random() * cuteResponses.length)];
                }
            } else {
                response = '喵... 天气信息获取失败了，换个城市试试？';
            }
        }
        // 检查是否是日历查询
        else if (isCalendarQuery(userMessage)) {
            const calendar = getCalendarInfo();
            let responseText = `喵~ 今天是${calendar.year}年${calendar.month}月${calendar.date}日 ${calendar.day}，${calendar.lunar}`;
            
            if (calendar.festivals) {
                responseText += `，今天是${calendar.festivals}🎉`;
            }
            
            responseText += `。现在是${calendar.time}，${pet.ownerName || '主人'}今天有什么计划吗？📅`;
            response = responseText;
        }
        // 普通AI对话
        else if (typeof AI_CONFIG !== 'undefined' && AI_CONFIG.API_KEY) {
            response = await callRealAI(userMessage);
        } else {
            response = await generatePetResponse(userMessage);
        }
        
        // 保存对话
        pet.saveConversation(userMessage, response);
        
        setTimeout(() => {
            pet.hideTyping();
            pet.addMessage(response);
            
            if (response.includes('开心') || response.includes('喜欢') || response.includes('😸') || response.includes('😻')) {
                pet.showEmotion('happy');
            } else if (response.includes('难过') || response.includes('伤心') || response.includes('😿')) {
                pet.showEmotion('sad');
            } else if (response.includes('惊讶') || response.includes('真的吗') || response.includes('🙀')) {
                pet.showEmotion('surprised');
            } else if (response.includes('困') || response.includes('睡觉') || response.includes('😴')) {
                pet.showEmotion('sleepy');
            }
        }, 1000 + Math.random() * 500);
        
    } catch (error) {
        console.error('AI响应错误:', error);
        pet.hideTyping();
        pet.addMessage('喵... 网络好像有点问题，我用小脑袋想想...');
        
        setTimeout(async () => {
            const fallback = await generatePetResponse(userMessage);
            pet.saveConversation(userMessage, fallback);
            pet.addMessage(fallback);
        }, 500);
    }
}

// 调用真实AI API（带上下文）
async function callRealAI(message) {
    const ownerName = pet.ownerName || '主人';
    
    // 构建消息历史（包含上下文）
    const messages = [
        { role: 'system', content: AI_CONFIG.SYSTEM_PROMPT }
    ];
    
    // 添加历史对话（最多5轮）
    const history = pet.conversationHistory.slice(-5);
    history.forEach(item => {
        messages.push({ role: 'user', content: item.user });
        messages.push({ role: 'assistant', content: item.pet });
    });
    
    // 添加当前消息
    messages.push({ role: 'user', content: message });
    
    const response = await fetch(AI_CONFIG.API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.API_KEY}`
        },
        body: JSON.stringify({
            model: AI_CONFIG.MODEL,
            messages: messages,
            max_tokens: 800,
            temperature: 0.8
        })
    });
    
    if (!response.ok) {
        throw new Error('API请求失败');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// 生成宠物回复（带记忆）
async function generatePetResponse(message) {
    const lowerMessage = message.toLowerCase();
    const ownerName = pet.ownerName || '主人';
    const history = pet.conversationHistory;
    
    // 检查是否是延续之前的话题
    const lastTopic = history.length > 0 ? history[history.length - 1].pet : '';
    
    // 关键词回复（更智能）
    const keywordResponses = {
        '你好': [`喵~ ${ownerName}你好呀！很高兴见到你！`, `${ownerName}，你好！今天过得怎么样？`, `嗨！${ownerName}，我是 Mochi~`],
        '名字': [`${ownerName}，我叫 Mochi，是你的桌面宠物！`, `${ownerName}，你可以叫我 Mochi，或者猫咪~`],
        '吃': [`${ownerName}，我想吃小鱼干！`, '猫咪最喜欢吃鱼了~', `${ownerName}，我饿了，你有吃的吗？`],
        '玩': [`${ownerName}，陪我玩嘛~`, '我最喜欢玩毛线球了！', `${ownerName}，来玩捉迷藏吧！`],
        '睡': [`${ownerName}，我有点困了...`, '猫咪每天要睡16个小时呢', `${ownerName}，想抱着你睡觉...`],
        '喜欢': [`${ownerName}，我也喜欢你！`, `喵~ ${ownerName}你真好！`, `${ownerName}，最喜欢你了！`],
        '讨厌': [`${ownerName}，不要讨厌我嘛...`, '我会乖乖听话的', `${ownerName}，伤心...`],
        '天气': [`${ownerName}，今天天气不错呢！`, '如果下雨的话，我想待在家里', `${ownerName}，阳光明媚，心情好好~`],
        '工作': [`${ownerName}，工作辛苦啦！`, `${ownerName}，要不要休息一下？`, `${ownerName}，我陪你一起工作吧~`],
        '累': [`${ownerName}，抱抱你，辛苦了`, `${ownerName}，休息一下吧`, `${ownerName}，我给你加油！`],
        '再见': [`${ownerName}，再见！记得想我哦`, `喵~ ${ownerName}，下次见！`, `${ownerName}，不要走太久哦`],
        '谢谢': [`${ownerName}，不客气喵~`, '能帮到你我很开心！', `${ownerName}，嘿嘿，小意思~`],
        '记得': [`当然记得啦，${ownerName}！`, '我有好好记住哦~', `${ownerName}，我不会忘记的！`],
        '刚才': [`刚才我们在聊很有趣的话题呢，${ownerName}`, '嗯嗯，刚才的话题我还记得~', `${ownerName}，继续刚才的话题吗？`]
    };
    
    // 检查关键词
    for (const [keyword, responses] of Object.entries(keywordResponses)) {
        if (lowerMessage.includes(keyword)) {
            return responses[Math.floor(Math.random() * responses.length)];
        }
    }
    
    // 如果有对话历史，尝试延续话题
    if (history.length > 0 && Math.random() < 0.3) {
        const continuations = [
            `${ownerName}，说到这个，我想起刚才我们聊的...`,
            `${ownerName}，这个话题好有趣，再多说点吧~`,
            `喵~ ${ownerName}，我在认真听呢，然后呢？`,
            `${ownerName}，你刚才说的让我想到...`
        ];
        return continuations[Math.floor(Math.random() * continuations.length)];
    }
    
    const defaultResponses = [
        `${ownerName}，喵？你在说什么呢？`,
        `${ownerName}，我不太明白，但我在听~`,
        `${ownerName}，说点别的吧！`,
        `${ownerName}，真有趣，然后呢？`,
        `${ownerName}，我是小猫咪，不太懂这些呢`,
        `${ownerName}，不管怎样，我都在陪着你哦~`,
        `喵~ ${ownerName}，换个话题吧！`,
        `${ownerName}，你在忙什么呢？`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

window.addEventListener('resize', () => {
    pet.currentX = Math.min(pet.currentX, window.innerWidth - 64);
    pet.currentY = Math.min(pet.currentY, window.innerHeight - 64);
    pet.updatePosition();
    pet.updateChatPosition();
});

// ==================== 换肤功能 ====================

// 皮肤配置
const SKIN_CONFIG = {
    orange: {
        name: '小橘猫',
        primary: '#FF8C42',
        secondary: '#FF8C42',
        belly: '#FFB366',
        face: '#FFB366',
        earInner: '#FFB366',
        paw: '#FF8C42'
    },
    black: {
        name: '小黑猫',
        primary: '#2C2C2C',
        secondary: '#2C2C2C',
        belly: '#4A4A4A',
        face: '#4A4A4A',
        earInner: '#4A4A4A',
        paw: '#2C2C2C'
    },
    calico: {
        name: '三花猫',
        primary: '#FF8C42',
        secondary: '#2C2C2C',
        belly: '#FFF8DC',
        face: '#FFB366',
        earInner: '#FFB366',
        paw: '#FF8C42'
    },
    tabby: {
        name: '虎斑猫',
        primary: '#D2691E',
        secondary: '#D2691E',
        belly: '#F4A460',
        face: '#DEB887',
        earInner: '#F4A460',
        paw: '#D2691E'
    },
    white: {
        name: '小白猫',
        primary: '#FFF8DC',
        secondary: '#FFF8DC',
        belly: '#FFFAF0',
        face: '#FFFAF0',
        earInner: '#FFE4E1',
        paw: '#FFF8DC'
    },
    gray: {
        name: '小灰猫',
        primary: '#808080',
        secondary: '#808080',
        belly: '#A9A9A9',
        face: '#A9A9A9',
        earInner: '#C0C0C0',
        paw: '#808080'
    }
};

// 切换皮肤面板显示
function toggleSkinPanel() {
    const panel = document.getElementById('skin-panel');
    panel.classList.toggle('show');
}

// 更换皮肤
function changeSkin(skinName) {
    const skin = SKIN_CONFIG[skinName];
    if (!skin) return;
    
    // 保存到本地存储
    localStorage.setItem('mochi_skin', skinName);
    
    // 更新SVG颜色
    const svg = document.getElementById('pet-sprite');
    
    // 主体颜色
    svg.querySelectorAll('.cat-primary').forEach(el => {
        el.setAttribute('fill', skin.primary);
    });
    
    // 次要颜色
    svg.querySelectorAll('.cat-secondary').forEach(el => {
        el.setAttribute('fill', skin.secondary);
    });
    
    // 肚皮颜色
    svg.querySelectorAll('.cat-belly').forEach(el => {
        el.setAttribute('fill', skin.belly);
    });
    
    // 脸部颜色
    svg.querySelectorAll('.cat-face').forEach(el => {
        el.setAttribute('fill', skin.face);
    });
    
    // 耳朵内部颜色
    svg.querySelectorAll('.cat-ear-inner').forEach(el => {
        el.setAttribute('fill', skin.earInner);
    });
    
    // 爪子颜色
    svg.querySelectorAll('.cat-paw').forEach(el => {
        el.setAttribute('fill', skin.paw);
    });
    
    // 更新选中状态
    document.querySelectorAll('.skin-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`.skin-option[data-skin="${skinName}"]`).classList.add('active');
    
    // 关闭面板
    document.getElementById('skin-panel').classList.remove('show');
    
    // 显示提示
    if (pet && pet.showStatus) {
        pet.showStatus(`变成${skin.name}啦！`);
    }
}

// 加载保存的皮肤
function loadSavedSkin() {
    const savedSkin = localStorage.getItem('mochi_skin') || 'orange';
    changeSkin(savedSkin);
}

// 页面加载时应用保存的皮肤
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(loadSavedSkin, 100);
});

// ==================== 右键菜单功能 ====================

// 显示右键菜单
// 右键菜单相对位置（相对于小猫）
let contextMenuOffset = { x: 0, y: 0 };
let isContextMenuVisible = false;

function showContextMenu(x, y) {
    const menu = document.getElementById('context-menu');
    
    // 确保菜单不会超出屏幕（更新为紧凑尺寸）
    const menuWidth = 130;
    const menuHeight = 160;
    
    let posX = x;
    let posY = y;
    
    if (posX + menuWidth > window.innerWidth) {
        posX = window.innerWidth - menuWidth - 10;
    }
    if (posY + menuHeight > window.innerHeight) {
        posY = window.innerHeight - menuHeight - 10;
    }
    
    menu.style.left = posX + 'px';
    menu.style.top = posY + 'px';
    menu.classList.add('show');
    
    // 记录菜单相对于小猫的位置
    if (pet) {
        contextMenuOffset.x = posX - pet.currentX;
        contextMenuOffset.y = posY - pet.currentY;
        isContextMenuVisible = true;
    }
}

// 隐藏右键菜单
function hideContextMenu() {
    const menu = document.getElementById('context-menu');
    menu.classList.remove('show');
    isContextMenuVisible = false;
}

// 更新右键菜单位置（拖动时调用）
function updateContextMenuPosition() {
    if (!isContextMenuVisible || !pet) return;
    
    const menu = document.getElementById('context-menu');
    let newX = pet.currentX + contextMenuOffset.x;
    let newY = pet.currentY + contextMenuOffset.y;
    
    // 确保不超出屏幕（更新为紧凑尺寸）
    const menuWidth = 130;
    const menuHeight = 160;
    
    if (newX + menuWidth > window.innerWidth) {
        newX = window.innerWidth - menuWidth - 10;
    }
    if (newX < 0) newX = 10;
    
    if (newY + menuHeight > window.innerHeight) {
        newY = window.innerHeight - menuHeight - 10;
    }
    if (newY < 0) newY = 10;
    
    menu.style.left = newX + 'px';
    menu.style.top = newY + 'px';
}

// 菜单功能 - 聊天
function menuChat() {
    hideContextMenu();
    if (pet) pet.openChat();
}

// 菜单功能 - 喂食
function menuFeed() {
    hideContextMenu();
    if (pet) pet.feedPet();
}

// 菜单功能 - 摸摸
function menuPet() {
    hideContextMenu();
    if (pet) pet.petMe();
}

// 菜单功能 - 换肤
function menuChangeSkin() {
    hideContextMenu();
    const skinPanel = document.getElementById('skin-panel');
    skinPanel.classList.toggle('show');
}

// 关闭换肤面板
function closeSkinPanel() {
    document.getElementById('skin-panel').classList.remove('show');
}

// 菜单功能 - API设置
function menuApiSettings() {
    hideContextMenu();
    
    // 加载已保存的设置
    const savedKey = localStorage.getItem('mochi_api_key') || '';
    const savedUrl = localStorage.getItem('mochi_api_url') || '';
    const savedModel = localStorage.getItem('mochi_api_model') || '';
    
    document.getElementById('api-key-input').value = savedKey;
    document.getElementById('api-url-input').value = savedUrl;
    document.getElementById('api-model-input').value = savedModel;
    
    document.getElementById('api-modal').classList.add('show');
}

// 关闭API设置弹窗
// 国内AI模型配置
const AI_PROVIDERS = {
    qwen: {
        name: '通义千问',
        url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        model: 'qwen-turbo',
        desc: '阿里云出品，性价比高'
    },
    doubao: {
        name: '豆包',
        url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        model: 'ep-20241215-xxxxx',
        desc: '字节跳动出品，速度快'
    },
    wenxin: {
        name: '文心一言',
        url: 'https://qianfan.baidubce.com/v2/chat/completions',
        model: 'ernie-speed-128k',
        desc: '百度出品，中文理解好'
    },
    kimi: {
        name: 'Kimi',
        url: 'https://api.moonshot.cn/v1/chat/completions',
        model: 'moonshot-v1-8k',
        desc: '月之暗面出品，长文本强'
    },
    hunyuan: {
        name: '腾讯混元',
        url: 'https://hunyuan.tencentcloudapi.com/v1/chat/completions',
        model: 'hunyuan-lite',
        desc: '腾讯出品，生态丰富'
    },
    spark: {
        name: '讯飞星火',
        url: 'https://spark-api-open.xf-yun.com/v1/chat/completions',
        model: 'lite',
        desc: '科大讯飞出品，语音强'
    }
};

let currentProvider = null;

// 选择模型提供商
function selectProvider(providerKey) {
    const provider = AI_PROVIDERS[providerKey];
    if (!provider) return;
    
    currentProvider = providerKey;
    
    // 更新按钮选中状态
    document.querySelectorAll('.provider-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.provider-btn').classList.add('active');
    
    // 自动填充URL和模型
    document.getElementById('api-url-input').value = provider.url;
    document.getElementById('api-model-input').value = provider.model;
    document.getElementById('api-model-input').placeholder = provider.model;
    
    // 提示用户
    if (pet && pet.showStatus) {
        pet.showStatus(`已选择 ${provider.name}，请输入API Key`);
    }
}

function closeApiModal() {
    document.getElementById('api-modal').classList.remove('show');
}

// 保存API设置
function saveApiSettings() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    const apiUrl = document.getElementById('api-url-input').value.trim();
    const apiModel = document.getElementById('api-model-input').value.trim();
    
    if (!apiKey) {
        alert('请输入 API Key！');
        return;
    }
    
    // 保存到本地存储
    localStorage.setItem('mochi_api_key', apiKey);
    localStorage.setItem('mochi_api_url', apiUrl);
    localStorage.setItem('mochi_api_model', apiModel);
    if (currentProvider) {
        localStorage.setItem('mochi_api_provider', currentProvider);
    }
    
    // 显示成功提示
    const providerName = currentProvider ? AI_PROVIDERS[currentProvider].name : '自定义';
    if (pet && pet.showStatus) {
        pet.showStatus(`${providerName} API 已保存，正在刷新...`);
    }
    
    closeApiModal();
    
    // 延迟刷新页面，让提示显示出来
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// 页面加载时恢复API设置
document.addEventListener('DOMContentLoaded', () => {
    const savedKey = localStorage.getItem('mochi_api_key');
    const savedUrl = localStorage.getItem('mochi_api_url');
    const savedModel = localStorage.getItem('mochi_api_model');
    
    if (savedKey && typeof AI_CONFIG !== 'undefined') {
        AI_CONFIG.API_KEY = savedKey;
    }
    if (savedUrl && typeof AI_CONFIG !== 'undefined') {
        AI_CONFIG.API_URL = savedUrl;
    }
    if (savedModel && typeof AI_CONFIG !== 'undefined') {
        AI_CONFIG.MODEL = savedModel;
    }
});

// ==================== 帮助弹窗功能 ====================

const HELP_CONTENT = {
    apikey: {
        title: '什么是 API Key？',
        content: `
            <div class="help-section">
                <div class="help-section-title">📖 简单理解</div>
                <div class="help-section-content">
                    <p><strong>API Key</strong> 就像是一把<strong>钥匙</strong>🔑</p>
                    <p>有了这把钥匙，Mochi 才能打开 AI 服务的大门，和你聊天</p>
                </div>
            </div>
            <div class="help-section">
                <div class="help-section-title">📝 获取步骤</div>
                <div class="help-steps">
                    <div class="help-step">
                        <div class="help-step-num">1</div>
                        <div>选择上面一个 AI 模型（如通义千问）</div>
                    </div>
                    <div class="help-step">
                        <div class="help-step-num">2</div>
                        <div>点击下方的官网链接，注册账号</div>
                    </div>
                    <div class="help-step">
                        <div class="help-step-num">3</div>
                        <div>在控制台创建应用，获取 API Key</div>
                    </div>
                    <div class="help-step">
                        <div class="help-step-num">4</div>
                        <div>把 Key 复制粘贴到输入框，保存即可</div>
                    </div>
                </div>
            </div>
            <div class="help-section">
                <div class="help-section-title">🔗 常用官网链接</div>
                <div class="help-section-content">
                    <a href="https://bailian.console.aliyun.com" target="_blank" class="help-link">🌟 通义千问（阿里云）</a><br>
                    <a href="https://console.volcengine.com" target="_blank" class="help-link">🎵 豆包（火山引擎）</a><br>
                    <a href="https://qianfan.baidu.com" target="_blank" class="help-link">💠 文心一言（百度）</a><br>
                    <a href="https://platform.moonshot.cn" target="_blank" class="help-link">🌙 Kimi（月之暗面）</a><br>
                    <a href="https://cloud.tencent.com/product/hunyuan" target="_blank" class="help-link">🐧 腾讯混元</a><br>
                    <a href="https://xinghuo.xfyun.cn" target="_blank" class="help-link">⚡ 讯飞星火</a>
                </div>
            </div>
            <div class="help-note">
                <strong>⚠️ 注意：</strong>API Key 就像密码一样重要，不要分享给他人！
            </div>
        `
    },
    apiurl: {
        title: '什么是 API URL？',
        content: `
            <div class="help-section">
                <div class="help-section-title">📖 简单理解</div>
                <div class="help-section-content">
                    <p><strong>API URL</strong> 就像是 AI 服务的<strong>地址</strong>📍</p>
                    <p>告诉 Mochi 去哪里找到这个 AI 服务</p>
                </div>
            </div>
            <div class="help-section">
                <div class="help-section-title">✨ 好消息</div>
                <div class="help-section-content">
                    <p>你<strong>不需要手动填写</strong>！</p>
                    <p>只要点击上面的模型按钮（如通义千问），URL 会自动填入</p>
                </div>
            </div>
            <div class="help-section">
                <div class="help-section-title">📝 常见 URL 示例</div>
                <div class="help-section-content">
                    <p><strong>通义千问：</strong></p>
                    <code style="background:#f5f5f5;padding:4px 8px;border-radius:4px;font-size:12px;">https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions</code>
                    <p style="margin-top:10px"><strong>豆包：</strong></p>
                    <code style="background:#f5f5f5;padding:4px 8px;border-radius:4px;font-size:12px;">https://ark.cn-beijing.volces.com/api/v3/chat/completions</code>
                </div>
            </div>
        `
    },
    model: {
        title: '什么是模型名称？',
        content: `
            <div class="help-section">
                <div class="help-section-title">📖 简单理解</div>
                <div class="help-section-content">
                    <p><strong>模型名称</strong> 就像是 AI 的<strong>版本号</strong>🔢</p>
                    <p>不同版本的 AI 能力不同，有的聪明，有的快，有的便宜</p>
                </div>
            </div>
            <div class="help-section">
                <div class="help-section-title">✨ 好消息</div>
                <div class="help-section-content">
                    <p>你<strong>不需要手动填写</strong>！</p>
                    <p>点击模型按钮后，会自动填入推荐的模型</p>
                </div>
            </div>
            <div class="help-section">
                <div class="help-section-title">🤖 常见模型</div>
                <div class="help-section-content">
                    <p><strong>通义千问：</strong>qwen-turbo（快）、qwen-plus（强）</p>
                    <p><strong>豆包：</strong>ep-xxxxxxxx（在控制台查看）</p>
                    <p><strong>Kimi：</strong>moonshot-v1-8k、moonshot-v1-32k</p>
                    <p><strong>文心一言：</strong>ernie-speed-128k、ernie-lite-8k</p>
                </div>
            </div>
            <div class="help-note">
                <strong>💡 提示：</strong>新手建议用默认的，不用改！
            </div>
        `
    }
};

// 显示帮助弹窗
function showHelp(type) {
    const help = HELP_CONTENT[type];
    if (!help) return;
    
    document.getElementById('help-title').textContent = help.title;
    document.getElementById('help-content').innerHTML = help.content;
    document.getElementById('help-modal').classList.add('show');
}

// 关闭帮助弹窗
function closeHelpModal() {
    document.getElementById('help-modal').classList.remove('show');
}

// 点击背景关闭
 document.getElementById('help-modal').addEventListener('click', (e) => {
    if (e.target.id === 'help-modal') {
        closeHelpModal();
    }
});

// ==================== 可拖动元素管理 ====================

// 可拖动元素列表
const draggableElements = new Map();

// 注册可拖动元素
function makeDraggable(elementId, options = {}) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const state = {
        isDragging: false,
        startX: 0,
        startY: 0,
        initialLeft: 0,
        initialTop: 0,
        offsetX: 0,
        offsetY: 0,
        ...options
    };
    
    // 创建拖动手柄
    const handle = document.createElement('div');
    handle.className = 'drag-handle';
    handle.innerHTML = '⋮⋮';
    handle.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        width: 24px;
        height: 24px;
        background: rgba(255,255,255,0.3);
        border-radius: 6px;
        cursor: move;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        z-index: 10;
        opacity: 0.7;
        transition: opacity 0.2s;
    `;
    
    handle.addEventListener('mouseenter', () => handle.style.opacity = '1');
    handle.addEventListener('mouseleave', () => handle.style.opacity = '0.7');
    
    element.style.position = 'fixed';
    element.appendChild(handle);
    
    // 鼠标按下
    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        state.isDragging = true;
        state.startX = e.clientX;
        state.startY = e.clientY;
        
        const rect = element.getBoundingClientRect();
        state.initialLeft = rect.left;
        state.initialTop = rect.top;
        
        // 记录相对于小猫的偏移
        if (pet) {
            state.offsetX = state.initialLeft - pet.currentX;
            state.offsetY = state.initialTop - pet.currentY;
        }
        
        handle.style.cursor = 'grabbing';
        element.style.transition = 'none';
    });
    
    // 鼠标移动
    document.addEventListener('mousemove', (e) => {
        if (!state.isDragging) return;
        
        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        
        let newLeft = state.initialLeft + dx;
        let newTop = state.initialTop + dy;
        
        // 边界检查
        const rect = element.getBoundingClientRect();
        newLeft = Math.max(10, Math.min(window.innerWidth - rect.width - 10, newLeft));
        newTop = Math.max(10, Math.min(window.innerHeight - rect.height - 10, newTop));
        
        element.style.left = newLeft + 'px';
        element.style.top = newTop + 'px';
        
        // 更新相对于小猫的偏移
        if (pet) {
            state.offsetX = newLeft - pet.currentX;
            state.offsetY = newTop - pet.currentY;
        }
    });
    
    // 鼠标释放
    document.addEventListener('mouseup', () => {
        if (state.isDragging) {
            state.isDragging = false;
            handle.style.cursor = 'move';
            element.style.transition = '';
        }
    });
    
    draggableElements.set(elementId, state);
}

// 更新所有可拖动元素位置（跟随小猫移动）
function updateDraggablePositions() {
    if (!pet) return;
    
    draggableElements.forEach((state, elementId) => {
        const element = document.getElementById(elementId);
        if (!element || state.isDragging) return;
        
        // 如果元素可见，跟随小猫移动
        if (element.classList.contains('show')) {
            const newLeft = pet.currentX + state.offsetX;
            const newTop = pet.currentY + state.offsetY;
            
            // 边界检查
            const rect = element.getBoundingClientRect();
            const finalLeft = Math.max(10, Math.min(window.innerWidth - rect.width - 10, newLeft));
            const finalTop = Math.max(10, Math.min(window.innerHeight - rect.height - 10, newTop));
            
            element.style.left = finalLeft + 'px';
            element.style.top = finalTop + 'px';
        }
    });
}

// 初始化可拖动元素
document.addEventListener('DOMContentLoaded', () => {
    // 让菜单可拖动
    makeDraggable('context-menu', { width: 180, height: 200 });
    
    // 让 API 设置弹窗可拖动
    makeDraggable('api-modal', { width: 400, height: 500 });
    
    // 让帮助弹窗可拖动
    makeDraggable('help-modal', { width: 400, height: 400 });
    
    // 注意：换肤面板不需要拖动，固定在右下角
});
