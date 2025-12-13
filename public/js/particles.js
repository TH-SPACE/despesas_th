// Configuração para efeito de partículas no background
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.init();
  }

  init() {
    // Criar canvas para as partículas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.zIndex = '-1'; // Atrás de outros elementos
    this.canvas.style.pointerEvents = 'none';
    
    document.body.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Criar partículas
    this.createParticles();
    
    // Iniciar animação
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  createParticles() {
    const particleCount = Math.floor((this.width * this.height) / 5000); // Ajuste baseado na resolução

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 3 + 1, // Um pouco maior para quadrados
        color: `rgba(46, 204, 113, ${Math.random() * 0.5 + 0.2})`, // Verde com transparência
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        originalRadius: 0
      });

      // Salvar o raio original para animação
      this.particles[i].originalRadius = this.particles[i].radius;
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Atualizar e desenhar partículas
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      
      // Atualizar posição
      p.x += p.speedX;
      p.y += p.speedY;
      
      // Efeito de "respiração" no tamanho
      p.radius = p.originalRadius + Math.sin(Date.now() * 0.001 + i) * 0.5;
      
      // Resetar posição se sair da tela
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;
      
          // Desenhar partícula como quadrado
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
    }
    
    // Conectar partículas próximas
    this.connectParticles();
    
    requestAnimationFrame(() => this.animate());
  }

  connectParticles() {
    const maxDistance = 120; // Aumentado para combinar com o novo modelo

    for (let a = 0; a < this.particles.length; a++) {
      for (let b = a + 1; b < this.particles.length; b++) {
        const distance = Math.sqrt(
          Math.pow(this.particles[a].x - this.particles[b].x, 2) +
          Math.pow(this.particles[a].y - this.particles[b].y, 2)
        );

        if (distance < maxDistance) {
          const opacity = 1 - distance / maxDistance;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(46, 204, 113, ${opacity * 0.3})`; // Verde com transparência
          this.ctx.lineWidth = 0.8; // Um pouco mais espesso
          this.ctx.moveTo(this.particles[a].x, this.particles[a].y);
          this.ctx.lineTo(this.particles[b].x, this.particles[b].y);
          this.ctx.stroke();
        }
      }
    }
  }
}

// Iniciar sistema de partículas quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
  new ParticleSystem();
});