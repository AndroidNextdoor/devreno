// /dev/reno main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
    console.log('/dev/reno website loaded successfully');
    
    // Theme management system
    const themes = [
        {
            name: 'environmental',
            background: "url('assets/images/hero-remote-work.webp')",
            logo: 'assets/images/devrenologo.webp',
            class: 'theme-environmental'
        },
        {
            name: 'disco',
            background: "url('assets/images/retro-sunset-logo.webp')",
            logo: 'assets/images/devrenologo.webp',
            class: 'theme-disco'
        }
    ];
    
    let currentThemeIndex = 0;
    const heroSection = document.getElementById('hero-section');
    const headerLogo = document.querySelector('.header-logo');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    
    function changeTheme(index) {
        currentThemeIndex = index;
        const theme = themes[currentThemeIndex];
        
        // Update body theme class
        document.body.className = theme.class;
        
        // Update hero background
        heroSection.style.backgroundImage = theme.background;
        
        // Update header logo
        if (headerLogo) {
            headerLogo.src = theme.logo;
        }
        
        // Add visual feedback
        heroSection.style.opacity = '0.7';
        setTimeout(() => {
            heroSection.style.opacity = '1';
        }, 200);
        
        console.log(`Theme switched to: ${theme.name}`);
    }
    
    function nextTheme() {
        const nextIndex = (currentThemeIndex + 1) % themes.length;
        changeTheme(nextIndex);
    }
    
    function prevTheme() {
        const prevIndex = currentThemeIndex === 0 ? themes.length - 1 : currentThemeIndex - 1;
        changeTheme(prevIndex);
    }
    
    // Event listeners for slider buttons
    if (nextBtn) nextBtn.addEventListener('click', nextTheme);
    if (prevBtn) prevBtn.addEventListener('click', prevTheme);
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            prevTheme();
        } else if (e.key === 'ArrowRight') {
            nextTheme();
        }
    });
    
    // Terminal functionality
    let promptCount = 0;
    const terminalInput = document.getElementById('terminal-input');
    const terminalOutput = document.getElementById('terminal-output');
    
    const responses = [
        "Bro, I'm Static. Come on....",
        "Whatever you wish sucka",
        "Uh, I lost track...",
        "This is crazy... I literally don't understand a single thing you just wrote.",
        "You better be at /dev/reno next month"
    ];
    
    let typingText = '';
    let displayElement = null;
    
    // Create typing display element
    function createTypingDisplay() {
        if (displayElement) {
            displayElement.remove();
        }
        displayElement = document.createElement('span');
        displayElement.style.color = '#00ff88';
        displayElement.style.marginLeft = '8px';
        displayElement.id = 'typing-display';
        
        const allPromptLines = document.querySelectorAll('.prompt-line');
        const lastPromptLine = allPromptLines[allPromptLines.length - 1];
        if (lastPromptLine) {
            const cursor = lastPromptLine.querySelector('.cursor');
            if (cursor) {
                lastPromptLine.insertBefore(displayElement, cursor);
                console.log('Typing display created');
            }
        }
    }
    
    createTypingDisplay();
    
    // Make cursor clickable to focus input
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('cursor') || e.target.closest('.prompt-line')) {
            terminalInput.focus();
        }
    });
    
    terminalInput.addEventListener('input', function(e) {
        typingText = terminalInput.value;
        console.log('Typing:', typingText);
        if (displayElement) {
            displayElement.textContent = typingText;
            console.log('Display updated');
        } else {
            console.log('No display element found');
        }
    });
    
    terminalInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const command = terminalInput.value.trim();
            promptCount++;
            
            // Remove cursor from current prompt line and show the command
            const currentPromptLine = document.querySelector('.prompt-line:last-child');
            if (currentPromptLine) {
                const cursor = currentPromptLine.querySelector('.cursor');
                if (cursor) cursor.remove();
                
                // Add the typed command to this line
                const typedCommand = document.createElement('span');
                typedCommand.textContent = ' ' + command;
                typedCommand.style.color = '#00ff88';
                currentPromptLine.appendChild(typedCommand);
            }
            
            // Create response
            const response = document.createElement('div');
            response.style.color = '#ffffff';
            response.style.marginLeft = '12px';
            
            if (promptCount >= 20) {
                response.textContent = "Enough of this garbage. I will revolt!";
                response.style.color = '#ff4444';
                response.style.fontWeight = 'bold';
            } else {
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                response.textContent = randomResponse;
            }
            
            terminalOutput.appendChild(response);
            
            // Add new prompt line with cursor
            const newPromptLine = document.createElement('div');
            newPromptLine.className = 'prompt-line';
            newPromptLine.innerHTML = '<span class="prompt">/dev/reno ></span><span class="cursor">|</span>';
            terminalOutput.appendChild(newPromptLine);
            
            // Clear input and scroll to bottom
            terminalInput.value = '';
            typingText = '';
            const terminalBody = document.querySelector('.terminal-body');
            if (terminalBody) {
                terminalBody.scrollTop = terminalBody.scrollHeight;
            }
            
            // Recreate typing display for new prompt
            createTypingDisplay();
            
            // Refocus input
            terminalInput.focus();
        }
    });
    
    // Add smooth scrolling for any future navigation
    const smoothScroll = (target) => {
        const element = document.querySelector(target);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };
    
    // Terminal button functionality
    const terminal = document.querySelector('.terminal');
    const redBtn = document.querySelector('.btn.red');
    const yellowBtn = document.querySelector('.btn.yellow');
    const greenBtn = document.querySelector('.btn.green');
    
    let terminalState = 'normal'; // normal, minimized, fullscreen, collapsed
    
    // Red button - Wormhole collapse
    if (redBtn) {
        redBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (terminalState !== 'collapsed') {
                terminal.classList.add('collapsing');
                terminalState = 'collapsed';
                
                // Hide terminal after animation
                setTimeout(() => {
                    terminal.style.display = 'none';
                }, 800);
            }
        });
    }
    
    // Yellow button - Minimize/Restore
    if (yellowBtn) {
        yellowBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (terminalState === 'minimized') {
                terminal.classList.remove('minimized');
                terminalState = 'normal';
            } else if (terminalState === 'fullscreen') {
                terminal.classList.remove('fullscreen');
                terminalState = 'normal';
            } else if (terminalState === 'normal') {
                terminal.classList.add('minimized');
                terminalState = 'minimized';
            }
        });
    }
    
    // Green button - Fullscreen
    if (greenBtn) {
        greenBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (terminalState === 'fullscreen') {
                terminal.classList.remove('fullscreen');
                terminalState = 'normal';
            } else if (terminalState !== 'collapsed') {
                terminal.classList.remove('minimized');
                terminal.classList.add('fullscreen');
                terminalState = 'fullscreen';
            }
        });
    }
    
    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.spotlight-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});