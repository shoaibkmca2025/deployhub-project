// DeployHub - Main JavaScript File
// Real-time CI/CD Platform Dashboard

class DeployHub {
    constructor() {
        this.deployments = [];
        this.hardware = [];
        this.activity = [];
        this.websocketConnected = false;
        this.charts = {};
        
        this.init();
    }

    init() {
        this.setupParticleBackground();
        this.setupAnimations();
        this.setupEventListeners();
        this.loadDemoData();
        this.setupCharts();
        this.startRealTimeUpdates();
        this.setupAIAssistant();
    }

    setupParticleBackground() {
        const canvas = document.getElementById('particleCanvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 50;

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                
                if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
                
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(6, 182, 212, ${particle.opacity})`;
                ctx.fill();
            });

            // Draw connections
            particles.forEach((particle, i) => {
                particles.slice(i + 1).forEach(otherParticle => {
                    const dx = particle.x - otherParticle.x;
                    const dy = particle.y - otherParticle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(otherParticle.x, otherParticle.y);
                        ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 * (1 - distance / 100)})`;
                        ctx.stroke();
                    }
                });
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    setupAnimations() {
        // Animate text splitting
        Splitting();
        
        // Animate hero text
        anime({
            targets: '[data-splitting] .char',
            translateY: [100, 0],
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 1400,
            delay: anime.stagger(30)
        });

        // Animate metric cards
        anime({
            targets: '.metric-card',
            translateY: [50, 0],
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 1000,
            delay: anime.stagger(100, {start: 500})
        });
    }

    setupEventListeners() {
        // Modal controls
        const newDeploymentBtn = document.getElementById('newDeploymentBtn');
        const connectHardwareBtn = document.getElementById('connectHardwareBtn');
        const deploymentModal = document.getElementById('deploymentModal');
        const closeModal = document.getElementById('closeModal');
        const cancelDeployment = document.getElementById('cancelDeployment');
        const createDeployment = document.getElementById('createDeployment');

        newDeploymentBtn?.addEventListener('click', () => {
            deploymentModal?.classList.remove('hidden');
            this.animateModalOpen();
        });

        connectHardwareBtn?.addEventListener('click', () => {
            window.location.href = 'hardware.html';
        });

        const closeModalHandler = () => {
            deploymentModal?.classList.add('hidden');
        };

        closeModal?.addEventListener('click', closeModalHandler);
        cancelDeployment?.addEventListener('click', closeModalHandler);
        deploymentModal?.addEventListener('click', (e) => {
            if (e.target === deploymentModal) closeModalHandler();
        });

        createDeployment?.addEventListener('click', () => {
            this.createNewDeployment();
        });

        // AI Assistant
        const askAIBtn = document.getElementById('askAIBtn');
        askAIBtn?.addEventListener('click', () => {
            this.askAI();
        });
    }

    animateModalOpen() {
        const modal = document.querySelector('#deploymentModal .glass-effect');
        anime({
            targets: modal,
            scale: [0.8, 1],
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 300
        });
    }

    loadDemoData() {
        // Demo deployments
        this.deployments = [
            {
                id: 1,
                name: 'react-ecommerce-app',
                status: 'running',
                device: 'MacBook Pro - Sarah\'s Laptop',
                lastDeploy: '2 minutes ago',
                buildTime: '3m 24s',
                commits: 12,
                health: 98
            },
            {
                id: 2,
                name: 'node-api-server',
                status: 'building',
                device: 'Raspberry Pi 4 - Home Server',
                lastDeploy: '5 minutes ago',
                buildTime: '1m 45s',
                commits: 8,
                health: 95
            },
            {
                id: 3,
                name: 'python-ml-service',
                status: 'running',
                device: 'Ubuntu Server - Development',
                lastDeploy: '1 hour ago',
                buildTime: '5m 12s',
                commits: 5,
                health: 92
            },
            {
                id: 4,
                name: 'static-website',
                status: 'stopped',
                device: 'MacBook Pro - Sarah\'s Laptop',
                lastDeploy: '3 hours ago',
                buildTime: '45s',
                commits: 3,
                health: 100
            }
        ];

        // Demo hardware
        this.hardware = [
            {
                id: 1,
                name: 'MacBook Pro - Sarah\'s Laptop',
                status: 'online',
                cpu: 45,
                memory: 62,
                storage: 78,
                lastSeen: 'now'
            },
            {
                id: 2,
                name: 'Raspberry Pi 4 - Home Server',
                status: 'online',
                cpu: 23,
                memory: 34,
                storage: 45,
                lastSeen: 'now'
            },
            {
                id: 3,
                name: 'Ubuntu Server - Development',
                status: 'offline',
                cpu: 0,
                memory: 0,
                storage: 0,
                lastSeen: '2 hours ago'
            }
        ];

        // Demo activity
        this.activity = [
            {
                type: 'deployment',
                message: 'Successfully deployed react-ecommerce-app',
                time: '2 minutes ago',
                status: 'success'
            },
            {
                type: 'build',
                message: 'Build started for node-api-server',
                time: '5 minutes ago',
                status: 'info'
            },
            {
                type: 'error',
                message: 'Deployment failed for python-ml-service',
                time: '1 hour ago',
                status: 'error'
            },
            {
                type: 'hardware',
                message: 'Raspberry Pi 4 connected',
                time: '2 hours ago',
                status: 'success'
            }
        ];

        this.renderDeployments();
        this.renderHardwareStatus();
        this.renderRecentActivity();
        this.animateCounters();
    }

    renderDeployments() {
        const container = document.getElementById('deploymentsList');
        if (!container) return;

        container.innerHTML = this.deployments.map(deployment => `
            <div class="deployment-card glass-effect rounded-xl p-6 border border-cyan-400/20">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="status-${deployment.status} text-lg">●</div>
                        <h3 class="font-semibold text-lg">${deployment.name}</h3>
                        <span class="px-2 py-1 text-xs rounded-full ${this.getStatusBadgeClass(deployment.status)}">
                            ${deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
                        </span>
                    </div>
                    <div class="flex space-x-2">
                        <button class="p-2 text-gray-400 hover:text-cyan-400 transition-colors" title="View Logs">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                        </button>
                        <button class="p-2 text-gray-400 hover:text-amber-400 transition-colors" title="Restart">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </button>
                        <button class="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Stop">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10h6v4H9z"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span class="text-gray-400">Device</span>
                        <p class="font-medium">${deployment.device}</p>
                    </div>
                    <div>
                        <span class="text-gray-400">Last Deploy</span>
                        <p class="font-medium">${deployment.lastDeploy}</p>
                    </div>
                    <div>
                        <span class="text-gray-400">Build Time</span>
                        <p class="font-medium">${deployment.buildTime}</p>
                    </div>
                    <div>
                        <span class="text-gray-400">Health</span>
                        <p class="font-medium text-green-400">${deployment.health}%</p>
                    </div>
                </div>
                
                <div class="mt-4 flex items-center space-x-4">
                    <div class="flex-1 bg-slate-700 rounded-full h-2">
                        <div class="bg-gradient-to-r from-cyan-400 to-amber-400 h-2 rounded-full" style="width: ${deployment.health}%"></div>
                    </div>
                    <span class="text-xs text-gray-400">${deployment.commits} commits</span>
                </div>
            </div>
        `).join('');

        // Animate deployment cards
        anime({
            targets: '.deployment-card',
            translateY: [30, 0],
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 800,
            delay: anime.stagger(100)
        });
    }

    renderHardwareStatus() {
        const container = document.getElementById('hardwareStatus');
        if (!container) return;

        container.innerHTML = this.hardware.map(device => `
            <div class="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div class="flex items-center space-x-3">
                    <div class="status-${device.status === 'online' ? 'running' : 'stopped'} text-lg">●</div>
                    <div>
                        <p class="font-medium text-sm">${device.name}</p>
                        <p class="text-xs text-gray-400">${device.status === 'online' ? device.lastSeen : 'Last seen: ' + device.lastSeen}</p>
                    </div>
                </div>
                ${device.status === 'online' ? `
                    <div class="text-right">
                        <p class="text-xs text-gray-400">CPU: ${device.cpu}%</p>
                        <p class="text-xs text-gray-400">RAM: ${device.memory}%</p>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    renderRecentActivity() {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        container.innerHTML = this.activity.map(item => `
            <div class="flex items-start space-x-3 p-3 bg-slate-800 rounded-lg">
                <div class="w-2 h-2 rounded-full mt-2 ${this.getActivityIconClass(item.status)}"></div>
                <div class="flex-1">
                    <p class="text-sm">${item.message}</p>
                    <p class="text-xs text-gray-400">${item.time}</p>
                </div>
            </div>
        `).join('');
    }

    getStatusBadgeClass(status) {
        const classes = {
            running: 'bg-green-500/20 text-green-400',
            building: 'bg-amber-500/20 text-amber-400',
            stopped: 'bg-gray-500/20 text-gray-400',
            error: 'bg-red-500/20 text-red-400'
        };
        return classes[status] || classes.stopped;
    }

    getActivityIconClass(status) {
        const classes = {
            success: 'bg-green-400',
            info: 'bg-cyan-400',
            error: 'bg-red-400',
            warning: 'bg-amber-400'
        };
        return classes[status] || classes.info;
    }

    animateCounters() {
        const counters = [
            { id: 'activeDeployments', target: 12 },
            { id: 'connectedDevices', target: 8 },
            { id: 'successRate', target: 94.2, suffix: '%' },
            { id: 'totalBuilds', target: 1247 }
        ];

        counters.forEach(counter => {
            const element = document.getElementById(counter.id);
            if (!element) return;

            anime({
                targets: { value: 0 },
                value: counter.target,
                duration: 2000,
                easing: 'easeOutExpo',
                update: function(anim) {
                    const value = anim.animatables[0].target.value;
                    element.textContent = Math.round(value * 10) / 10 + (counter.suffix || '');
                }
            });
        });
    }

    setupCharts() {
        // Resource Usage Chart
        const resourceChart = echarts.init(document.getElementById('resourceChart'));
        if (resourceChart) {
            const option = {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'axis',
                    backgroundColor: '#1e293b',
                    borderColor: '#06b6d4',
                    textStyle: { color: '#f1f5f9' }
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                    axisLine: { lineStyle: { color: '#475569' } },
                    axisLabel: { color: '#94a3b8' }
                },
                yAxis: {
                    type: 'value',
                    axisLine: { lineStyle: { color: '#475569' } },
                    axisLabel: { color: '#94a3b8' },
                    splitLine: { lineStyle: { color: '#334155' } }
                },
                series: [{
                    name: 'CPU Usage',
                    type: 'line',
                    data: [45, 52, 38, 67, 73, 45],
                    smooth: true,
                    lineStyle: { color: '#06b6d4' },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(6, 182, 212, 0.3)' },
                                { offset: 1, color: 'rgba(6, 182, 212, 0.05)' }
                            ]
                        }
                    }
                }]
            };
            resourceChart.setOption(option);
        }
    }

    setupAIAssistant() {
        const messages = [
            "I've analyzed your repository. This appears to be a Node.js Express application. I recommend using npm install && npm run build for optimal performance.",
            "Your Raspberry Pi 4 is running at optimal temperature. CPU usage is within normal parameters for continuous deployment.",
            "I notice you're using React 18. Consider enabling the new concurrent features for better performance in production.",
            "Your deployment success rate is excellent! The automated rollback system has prevented 3 potential outages this month.",
            "I've detected that your environment variables might need optimization. Would you like me to suggest improvements?"
        ];

        let currentMessageIndex = 0;

        const showNextMessage = () => {
            const element = document.querySelector('.typed-text');
            if (!element) return;

            new Typed(element, {
                strings: [messages[currentMessageIndex]],
                typeSpeed: 30,
                showCursor: false,
                onComplete: () => {
                    setTimeout(() => {
                        currentMessageIndex = (currentMessageIndex + 1) % messages.length;
                        setTimeout(showNextMessage, 2000);
                    }, 3000);
                }
            });
        };

        setTimeout(showNextMessage, 1000);
    }

    askAI() {
        const questions = [
            "How can I optimize my Docker builds for faster deployment?",
            "What's the best way to set up environment variables securely?",
            "Can you help me troubleshoot this build error?",
            "How do I scale my deployment across multiple devices?",
            "What's the recommended resource allocation for a Node.js app?"
        ];

        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        const aiMessage = document.getElementById('aiMessage');
        if (aiMessage) {
            aiMessage.innerHTML = `<span class="typed-text"></span>`;
            
            setTimeout(() => {
                new Typed(aiMessage.querySelector('.typed-text'), {
                    strings: [randomQuestion],
                    typeSpeed: 30,
                    showCursor: false
                });
            }, 100);
        }
    }

    createNewDeployment() {
        const newDeployment = {
            id: this.deployments.length + 1,
            name: 'new-deployment-' + Date.now(),
            status: 'building',
            device: 'MacBook Pro - Sarah\'s Laptop',
            lastDeploy: 'just now',
            buildTime: '0m 00s',
            commits: 0,
            health: 0
        };

        this.deployments.unshift(newDeployment);
        this.renderDeployments();
        
        // Close modal
        document.getElementById('deploymentModal')?.classList.add('hidden');
        
        // Simulate build progress
        this.simulateBuild(newDeployment);
    }

    simulateBuild(deployment) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            deployment.health = Math.min(progress, 100);
            deployment.buildTime = `${Math.floor(progress / 20)}m ${Math.floor(Math.random() * 60)}s`;
            
            if (progress >= 100) {
                clearInterval(interval);
                deployment.status = 'running';
                deployment.health = 98;
                deployment.buildTime = '3m 24s';
                deployment.commits = 1;
            }
            
            this.renderDeployments();
        }, 1000);
    }

    startRealTimeUpdates() {
        // Simulate real-time updates
        setInterval(() => {
            // Update hardware metrics
            this.hardware.forEach(device => {
                if (device.status === 'online') {
                    device.cpu = Math.max(0, Math.min(100, device.cpu + (Math.random() - 0.5) * 10));
                    device.memory = Math.max(0, Math.min(100, device.memory + (Math.random() - 0.5) * 8));
                }
            });
            
            // Update deployment health
            this.deployments.forEach(deployment => {
                if (deployment.status === 'running') {
                    deployment.health = Math.max(90, Math.min(100, deployment.health + (Math.random() - 0.5) * 2));
                }
            });
            
            this.renderHardwareStatus();
            this.renderDeployments();
        }, 5000);

        // Simulate WebSocket connection
        setTimeout(() => {
            this.websocketConnected = true;
            console.log('WebSocket connected - Real-time updates enabled');
        }, 1000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new DeployHub();
});

// Utility functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-amber-500' : 'bg-cyan-500'
    } text-white`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    anime({
        targets: notification,
        translateX: [300, 0],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 300
    });
    
    setTimeout(() => {
        anime({
            targets: notification,
            translateX: [0, 300],
            opacity: [1, 0],
            easing: 'easeInExpo',
            duration: 300,
            complete: () => notification.remove()
        });
    }, 3000);
}

// Export for use in other files
window.DeployHub = DeployHub;
window.showNotification = showNotification;