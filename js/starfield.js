/* MAL starfield canvas — original implementation */
(function (global) {
  'use strict';
  function Starfield(canvas) {
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var W, H, stars = [], shooting = [];
    var mouse = { x: 0.5, y: 0.5 };
    var raf = null;

    function resize() {
      W = canvas.width = canvas.offsetWidth || window.innerWidth;
      H = canvas.height = canvas.offsetHeight || window.innerHeight;
      seed();
    }

    function seed() {
      stars = [];
      var count = Math.min(260, Math.floor((W * H) / 5200));
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random(), y: Math.random(),
          r: Math.random() * 1.3 + 0.2,
          tw: Math.random() * Math.PI * 2,
          sp: 0.4 + Math.random() * 2.2,
          hue: Math.random() < 0.75 ? null : (Math.random() < 0.5 ? '#6ee7ff' : '#a78bfa')
        });
      }
    }

    function step(t) {
      ctx.clearRect(0, 0, W, H);
      var px = (mouse.x - 0.5) * 22;
      var py = (mouse.y - 0.5) * 22;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var sx = s.x * W + px * (s.y * s.y);
        var sy = s.y * H + py * (s.x * s.x);
        var a = 0.35 + 0.65 * Math.abs(Math.sin(s.tw + t / 1000 * s.sp));
        ctx.globalAlpha = a;
        ctx.fillStyle = s.hue || '#cfe0ff';
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      /* shooting stars */
      if (Math.random() < 0.006) {
        shooting.push({
          x: Math.random() * W * 0.7 + W * 0.2, y: Math.random() * H * 0.25,
          vx: -4.2, vy: 2.4, life: 1
        });
      }
      shooting = shooting.filter(function (sh) {
        sh.x += sh.vx; sh.y += sh.vy; sh.vx *= 0.985; sh.vy *= 0.985; sh.life -= 0.018;
        if (sh.life <= 0) return false;
        var grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 9, sh.y - sh.vy * 9);
        grad.addColorStop(0, 'rgba(220,240,255,' + (0.85 * sh.life) + ')');
        grad.addColorStop(1, 'rgba(220,240,255,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - sh.vx * 9, sh.y - sh.vy * 9);
        ctx.stroke();
        return true;
      });
      raf = requestAnimationFrame(step);
    }

    var onMove = function (e) {
      mouse.x = e.clientX / Math.max(1, window.innerWidth);
      mouse.y = e.clientY / Math.max(1, window.innerHeight);
    };
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    resize();
    raf = requestAnimationFrame(step);

    this.destroy = function () {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }
  global.MALStarfield = Starfield;
})(window);
