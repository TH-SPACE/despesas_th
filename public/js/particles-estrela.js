// Configuração alternativa para efeito de partículas no background - modelo estrela
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
    
    // Criar partículas em forma de estrela
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
    const particleCount = Math.floor((this.width * this.height) / 8000); // Ainda menos partículas para estrelas
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 3 + 2, // Tamanho das estrelas
        color: `rgba(255, 215, 0, ${Math.random() * 0.5 + 0.2})`, // Dourado com transparência
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * Math.PI * 2, // Rotação inicial
        rotationSpeed: (Math.random() - 0.5) * 0.01, // Velocidade de rotação
        twinkleSpeed: Math.random() * 0.02 + 0.01 // Velocidade de brilho
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
      
      // Atualizar brilho (efeito de twinkling)
      const alpha = 0.2 + Math.abs(Math.sin(Date.now() * p.twinkleSpeed + i) * 0.3);
      const color = `rgba(255, 215, 0, ${alpha})`;
      
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
      
      // Desenhar estrela
      this.drawStar(0, 0, p.size, p.size * 2, 5); // (x, y, inner radius, outer radius, points)
      this.ctx.fillStyle = color;
      this.ctx.fill();
      
      // Restaurar o estado do contexto
      this.ctx.restore();
    }
    
    // Conectar partículas próximas
    this.connectParticles();
    
    requestAnimationFrame(() => this.animate());
  }

  drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }

    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
  }

  connectParticles() {
    const maxDistance = 130; // Ajustado para combinar com o novo modelo
    
    for (let a = 0; a < this.particles.length; a++) {
      for (let b = a + 1; b < this.particles.length; b++) {
        const distance = Math.sqrt(
          Math.pow(this.particles[a].x - this.particles[b].x, 2) +
          Math.pow(this.particles[a].y - this.particles[b].y, 2)
        );
        
        if (distance < maxDistance) {
          const opacity = 1 - distance / maxDistance;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(255, 215, 0, ${opacity * 0.2})`; // Dourado com transparência
          this.ctx.lineWidth = 0.4; // Um pouco mais fino
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