import { Component, ElementRef, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Metaball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

@Component({
  selector: 'app-metaballs-screensaver',
  templateUrl: './metaballs.component.html',
  styleUrls: ['./metaballs.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class MetaballsScreenSaverComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('metaballCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private balls: Metaball[] = [];
  private animationId!: number;

  ngOnInit() {}

  private onResize = () => {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;
    if (!container) return;

    const oldScale = this.getScaleFactor();
    const isMobileResize = window.innerWidth < 768;
    const currentDivisor = isMobileResize ? 1 : 2;

    // Ricalcola in base al container
    canvas.width = container.clientWidth / currentDivisor;
    canvas.height = container.clientHeight / currentDivisor;

    const newScale = this.getScaleFactor();
    const resizeRatio = newScale / oldScale;

    this.balls.forEach(ball => {
      ball.radius *= resizeRatio;
      ball.vx *= resizeRatio;
      ball.vy *= resizeRatio;

      if (ball.x + ball.radius > canvas.width) ball.x = canvas.width - ball.radius;
      if (ball.y + ball.radius > canvas.height) ball.y = canvas.height - ball.radius;
    });
  };

  ngAfterViewInit() {
    this.initCanvas();
    this.generateBalls();
    this.animate();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    // Rimuoviamo l'evento per evitare leak di memoria!
    window.removeEventListener('resize', this.onResize);
  }

  private getScaleFactor(): number {
    if (!this.canvasRef) return 1;
    const container = this.canvasRef.nativeElement.parentElement;
    if (!container) return 1;

    // Calcoliamo la scala rispetto alla grandezza standard di un player (es. 1280x720)
    const referenceDiagonal = Math.sqrt(1280 * 1280 + 720 * 720);
    const currentDiagonal = Math.sqrt(container.clientWidth * container.clientWidth + container.clientHeight * container.clientHeight);
    
    return (currentDiagonal / referenceDiagonal) || 1;
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    // Prendiamo le dimensioni del contenitore padre (il player)
    const container = canvas.parentElement!;
    this.ctx = canvas.getContext('2d')!;
    
    const isMobile = window.innerWidth < 768;
    const divisor = isMobile ? 1 : 2;

    canvas.width = container.clientWidth / divisor;
    canvas.height = container.clientHeight / divisor;

    window.addEventListener('resize', this.onResize);
  }


  private generateBalls() {
    const canvas = this.canvasRef.nativeElement;
    
    // ADATTAMENTO DENSITÀ: Meno sfere sugli schermi piccoli per non intasare lo spazio
    const isMobile = window.innerWidth < 768;
    const numberOfBalls = isMobile ? 6 : 10; 

    this.balls = []; // Svuotiamo l'array per sicurezza

    for (let i = 0; i < numberOfBalls; i++) {
      // Raggio base equilibrato (circa 70-110px su desktop, proporzionato su mobile)
      const radius = isMobile 
        ? Math.random() * 10 + 20 
        : Math.random() * 15 + 30;

      this.balls.push({
        x: Math.random() * (canvas.width - radius * 2) + radius,
        y: Math.random() * (canvas.height - radius * 2) + radius,
        vx: (Math.random() - 0.5) * 2.5 * this.getScaleFactor(), 
        vy: (Math.random() - 0.5) * 2.5 * this.getScaleFactor(),
        radius: radius
      });
    }
  }

  private animate = () => {
    const canvas = this.canvasRef.nativeElement;
    
    // Puliamo il canvas ad ogni frame lasciandolo totalmente trasparente
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.balls.forEach(ball => {
      // Movimento invariato
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ball.radius < 0) { ball.vx *= -1; ball.x = ball.radius; } 
      else if (ball.x + ball.radius > canvas.width) { ball.vx *= -1; ball.x = canvas.width - ball.radius; }
      
      if (ball.y - ball.radius < 0) { ball.vy *= -1; ball.y = ball.radius; } 
      else if (ball.y + ball.radius > canvas.height) { ball.vy *= -1; ball.y = canvas.height - ball.radius; }

      // 🚀 DISEGNO SEMPLIFICATO: Cerchi rossi solidi. Più veloce e pulito!
      this.ctx.fillStyle = '#b22222'; // Rosso base NexuStream
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.animationId = requestAnimationFrame(this.animate);
  }

}