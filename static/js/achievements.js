class AchievementSystem {
    constructor() {
        this.achievements = [
            {
                id: 'rookie',
                name: 'Rookie Pilot',
                description: 'Score 1,000 points in a single run',
                icon: '🎯',
                requirement: 1000,
                type: 'score',
                unlocked: false
            },
            {
                id: 'expert',
                name: 'Expert Navigator',
                description: 'Score 5,000 points in a single run',
                icon: '🏆',
                requirement: 5000,
                type: 'score',
                unlocked: false
            },
            {
                id: 'powerup_collector',
                name: 'Power-up Collector',
                description: 'Collect 5 power-ups in a single run',
                icon: '⭐',
                requirement: 5,
                type: 'powerups',
                unlocked: false
            },
            {
                id: 'multiplier_master',
                name: 'Multiplier Master',
                description: 'Reach a 3x score multiplier',
                icon: '✨',
                requirement: 3,
                type: 'multiplier',
                unlocked: false
            },
            {
                id: 'survivor',
                name: 'Survivor',
                description: 'Stay alive for 60 seconds',
                icon: '⏱️',
                requirement: 60,
                type: 'time',
                unlocked: false
            }
        ];

        this.stats = {
            score: 0,
            powerups: 0,
            multiplier: 1,
            time: 0
        };

        this.loadAchievements();
    }

    update(stats) {
        this.stats = stats;
        let newUnlocks = false;

        this.achievements.forEach(achievement => {
            if (!achievement.unlocked) {
                switch (achievement.type) {
                    case 'score':
                        if (this.stats.score >= achievement.requirement) {
                            this.unlockAchievement(achievement);
                            newUnlocks = true;
                        }
                        break;
                    case 'powerups':
                        if (this.stats.powerups >= achievement.requirement) {
                            this.unlockAchievement(achievement);
                            newUnlocks = true;
                        }
                        break;
                    case 'multiplier':
                        if (this.stats.multiplier >= achievement.requirement) {
                            this.unlockAchievement(achievement);
                            newUnlocks = true;
                        }
                        break;
                    case 'time':
                        if (this.stats.time >= achievement.requirement) {
                            this.unlockAchievement(achievement);
                            newUnlocks = true;
                        }
                        break;
                }
            }
        });

        if (newUnlocks) {
            this.saveAchievements();
            this.updateAchievementDisplay();
        }
    }

    unlockAchievement(achievement) {
        achievement.unlocked = true;
        this.showNotification(achievement);
    }

    showNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-text">
                <div class="achievement-title">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 100);
    }

    saveAchievements() {
        localStorage.setItem('achievements', JSON.stringify(this.achievements));
    }

    loadAchievements() {
        const saved = localStorage.getItem('achievements');
        if (saved) {
            const savedAchievements = JSON.parse(saved);
            this.achievements.forEach(achievement => {
                const savedAchievement = savedAchievements.find(a => a.id === achievement.id);
                if (savedAchievement) {
                    achievement.unlocked = savedAchievement.unlocked;
                }
            });
        }
    }

    updateAchievementDisplay() {
        const achievementsList = document.getElementById('achievementsList');
        if (!achievementsList) return;

        achievementsList.innerHTML = this.achievements.map(achievement => `
            <li class="achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                </div>
                <div class="achievement-status">
                    ${achievement.unlocked ? '✅' : '🔒'}
                </div>
            </li>
        `).join('');
    }

    resetProgress() {
        this.achievements.forEach(achievement => achievement.unlocked = false);
        this.saveAchievements();
        this.updateAchievementDisplay();
    }
}
