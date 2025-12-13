// Configuração alternativa para efeito de partículas no background - modelo triângulo
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
    
    // Criar partículas em forma de triângulo
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
    const particleCount = Math.floor((this.width * this.height) / 6000); // Menos partículas para triângulos
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 4 + 2, // Tamanho das partículas
        color: `rgba(255, 255, 255, ${Math.random() * 0.4 + 0.1})`, // Branco com transparência
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4,
        rotation: Math.random() * Math.PI * 2, // Rotação inicial
        rotationSpeed: (Math.random() - 0.5) * 0.02 // Velocidade de rotação
      });
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
      
      // Atualizar rotação
      p.rotation += p.rotationSpeed;
      
      // Resetar posição se sair da tela
      if (p.x < -20) p.x = this.width + 20;
      if (p.x > this.width + 20) p.x = -20;
      if (p.y < -20) p.y = this.height + 20;
      if (p.y > this.height + 20) p.y = -20;
      
      // Salvar o estado atual do contexto
      this.ctx.save();
      
      // Mover para a posição da partícula e rotacionar
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      
      // Desenhar triângulo
      this.ctx.beginPath();
      this.ctx.moveTo(0, -p.size); // Topo do triângulo
      this.ctx.lineTo(-p.size, p.size); // Base esquerda
      this.ctx.lineTo(p.size, p.size); // Base direita
      this.ctx.closePath();
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
      
      // Restaurar o estado do contexto
      this.ctx.restore();
    }
    
    // Conectar partículas próximas
    this.connectParticles();
    
    requestAnimationFrame(() => this.animate());
  }

  connectParticles() {
    const maxDistance = 100;
    
    for (let a = 0; a < this.particles.length; a++) {
      for (let b = a + 1; b < this.particles.length; b++) {
        const distance = Math.sqrt(
          Math.pow(this.particles[a].x - this.particles[b].x, 2) +
          Math.pow(this.particles[a].y - this.particles[b].y, 2)
        );
        
        if (distance < maxDistance) {
          const opacity = 1 - distance / maxDistance;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.2})`;
          this.ctx.lineWidth = 0.5;
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