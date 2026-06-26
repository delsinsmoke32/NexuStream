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
  selector: 'app-metaballs',
  templateUrl: './metaballs.page.html',
  styleUrls: ['./metaballs.page.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class MetaballsPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('metaballCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private balls: Metaball[] = [];
  private animationId!: number;

  ngOnInit() {}

  ngAfterViewInit() {
    this.initCanvas();
    this.generateBalls();
    this.animate();
  }

  ngOnDestroy() {
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  private getScaleFactor(): number {
    const canvas = this.canvasRef.nativeElement;
    
    const referenceDiagonal = Math.sqrt(1920 * 1920 + 1080 * 1080);
    const currentDiagonal = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight);
    
    return currentDiagonal / referenceDiagonal;
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    
    
    const isMobile = window.innerWidth < 768;
    const divisor = isMobile ? 1 : 2;

    canvas.width = window.innerWidth / divisor;
    canvas.height = window.innerHeight / divisor;

    window.addEventListener('resize', () => {
      const oldScale = this.getScaleFactor();

      const isMobileResize = window.innerWidth < 768;
      const currentDivisor = isMobileResize ? 1 : 2;

      canvas.width = window.innerWidth / currentDivisor;
      canvas.height = window.innerHeight / currentDivisor;

      const newScale = this.getScaleFactor();
      const resizeRatio = newScale / oldScale;

      this.balls.forEach(ball => {
        ball.radius *= resizeRatio;
        ball.vx *= resizeRatio;
        ball.vy *= resizeRatio;

        if (ball.x + ball.radius > canvas.width) ball.x = canvas.width - ball.radius;
        if (ball.y + ball.radius > canvas.height) ball.y = canvas.height - ball.radius;
      });
    });
  }

  private generateBalls() {
    const canvas = this.canvasRef.nativeElement;
    
    
    const isMobile = window.innerWidth < 768;
    const numberOfBalls = 15; 

    this.balls = []; 

    for (let i = 0; i < numberOfBalls; i++) {
      
      const radius = isMobile ? (Math.random() * 40 + 100) * this.getScaleFactor() : (Math.random() * 40 + 70) * this.getScaleFactor();
      
      this.balls.push({
        x: Math.random() * (canvas.width - radius * 2) + radius,
        y: Math.random() * (canvas.height - radius * 2) + radius,
        vx: (Math.random() - 0.5) * 4 * this.getScaleFactor(), 
        vy: (Math.random() - 0.5) * 4 * this.getScaleFactor(), 
        radius: radius
      });
    }
  }

  private animate = () => {
    const canvas = this.canvasRef.nativeElement;
    
   
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    
    this.balls.forEach(ball => {
      
      ball.x += ball.vx;
      ball.y += ball.vy;

      
      if (ball.x - ball.radius < 0) {
        ball.vx *= -1;
        ball.x = ball.radius;
      } else if (ball.x + ball.radius > canvas.width){
        ball.vx *= -1;
        ball.x = canvas.width - ball.radius;
      }
      
      if (ball.y - ball.radius < 0) {
        ball.vy *= -1;
        ball.y = ball.radius;
      } else if (ball.y + ball.radius > canvas.height){
        ball.vy *= -1;
        ball.y = canvas.height - ball.radius;
      }

      
      const gradient = this.ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
      gradient.addColorStop(0, 'rgba(229, 9, 20, 1)'); 
      gradient.addColorStop(1, 'rgba(229, 9, 20, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    
    this.animationId = requestAnimationFrame(this.animate);
  }

}