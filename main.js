class Player {
  constructor(x, y, radius, color) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
  }

  draw() {
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
  }
}

class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
  }

  draw() {
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
  }

  update() {
    this.draw()
    this.x += this.velocity.x
    this.y += this.velocity.y
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
  }

  draw() {
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
  }

  update() {
    this.draw()
    this.x += this.velocity.x
    this.y += this.velocity.y
  }
}

class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x
    this.y = y
    this.radius = radius
    this.color = color
    this.velocity = velocity
    this.alpha = 1
  }

  draw() {
    c.save()
    c.globalAlpha = this.alpha
    c.beginPath()
    c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    c.fillStyle = this.color
    c.fill()
    c.restore()
  }

  update() {
    this.draw()
    this.velocity.x *= particleFriction
    this.velocity.y *= particleFriction
    this.x += this.velocity.x
    this.y += this.velocity.y
    this.alpha -= particleAlphaChangeSpeed
  }
}

// Config
let isGameover = true

// Canvas
const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
canvas.width = innerWidth
canvas.height = innerHeight

// Score
const scoreEl = document.querySelector('#scoreEl')
const modalEl = document.querySelector('#modalEl')
const modalScoreEl = document.querySelector('#modalScoreEl')
let score = 0

// Player
const playerX = canvas.width / 2
const playerY = canvas.height / 2
let player = new Player(playerX, playerY, 15, 'white')

// Projectile
let projectiles = []
const projectileRadius = 5
const projectileAccelerator = 5

// Enemy
let enemies = []
const enemyAccelerator = 1
const enemySpawnTime = 1100

// Particle
let particles = []
const particleFriction = 0.99
const particleAlphaChangeSpeed = 0.012

// Music
let backgroundAudio = null

document.querySelector('#startGameEl').addEventListener('click', (event) => {
  event.stopPropagation()
  resetGame()
  animate()
  spawnEnemies()
  modalEl.style.display = 'none'
  new Audio('/music/startGame.mp3').play()
})

function resetGame() {
  player = new Player(playerX, playerY, 15, 'white')
  projectiles = []
  enemies = []
  particles = []
  score = 0
  increaseScore(0)
  clearInterval(intervalId)
  isGameover = false

  // play background music
  if (!backgroundAudio) {
    backgroundAudio = document.createElement('audio')
    backgroundAudio.setAttribute('src', '/music/backgroundMusic.mp3')
    backgroundAudio.setAttribute('autoplay', 'autoplay')
    backgroundAudio.volume = 0.7
    backgroundAudio.play()
    backgroundAudio.addEventListener(
      'ended',
      function () {
        // don't convert it to lambda. otherwise 'this' not working
        this.currentTime = 0
        this.play()
      },
      false
    )
  }
}

function gameover() {
  new Audio('/music/endGame.mp3').play()
  isGameover = true
  cancelAnimationFrame(animationId)
  modalScoreEl.innerHTML = score
  modalEl.style.display = 'flex'
}

let intervalId
function spawnEnemies() {
  intervalId = setInterval(() => {
    const radius = Math.random() * (30 - 10) + 10
    let x = 0
    let y = 0

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
      y = Math.random() * canvas.height
    } else {
      x = Math.random() * canvas.width
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
    }

    const color = `hsl(${Math.random() * 360}, 50%, 50%)`
    const angle = Math.atan2(playerY - y, playerX - x)
    const velocity = {
      x: Math.cos(angle) * enemyAccelerator,
      y: Math.sin(angle) * enemyAccelerator,
    }

    enemies.push(new Enemy(x, y, radius, color, velocity))
  }, enemySpawnTime)
}

function increaseScore(amount) {
  score += amount
  scoreEl.innerHTML = score
}

function checkCircleCollision(obj1, obj2) {
  const dist = Math.hypot(obj1.x - obj2.x, obj1.y - obj2.y)

  const haveCollision = dist - obj2.radius < obj1.radius
  return haveCollision
}

let animationId
function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  player.draw()

  particles.forEach((particle, index) => {
    if (particle.alpha > 0) {
      particle.update()
    } else {
      particles.splice(index, 1)
    }
  })

  projectiles.forEach((projectile, index) => {
    projectile.update()

    // remove projectiles out of screen
    if (
      projectile.x + projectile.radius < 0 ||
      projectile.y + projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y - projectile.radius > canvas.height
    ) {
      setTimeout(() => {
        // use setTimeout to prevent flashing
        projectiles.splice(index, 1)
      }, 0)
    }
  })

  enemies.forEach((enemy, index) => {
    enemy.update()

    // check enemy collision with player
    const haveCollision = checkCircleCollision(player, enemy)

    if (haveCollision) {
      gameover()
    }

    // check enemy collision with projectiles
    projectiles.forEach((projectile, projectileIndex) => {
      const haveCollision = checkCircleCollision(projectile, enemy)

      if (haveCollision) {
        // create particle(explosion)
        const enemyParticleCount = enemy.radius * 2
        for (let i = 0; i < enemyParticleCount; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 3,
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * 6),
                y: (Math.random() - 0.5) * (Math.random() * 6),
              }
            )
          )
        }

        if (enemy.radius - 10 > 9) {
          // shrink enemy size
          gsap.to(enemy, {
            radius: enemy.radius - 10,
          })

          // remove projectile
          setTimeout(() => {
            // use setTimeout to prevent flashing
            projectiles.splice(projectileIndex, 1)
          }, 0)

          // play hit effect audio
          new Audio('/music/enemyHit.mp3').play()
          increaseScore(100)
        } else {
          // remove enemy and projectile
          setTimeout(() => {
            // use setTimeout to prevent flashing
            enemies.splice(index, 1)
            projectiles.splice(projectileIndex, 1)

            // play distroy effect audio
            new Audio('/music/enemyEliminated.mp3').play()
          }, 0)

          increaseScore(250)
        }
      }
    })
  })
}

addEventListener('click', (event) => {
  if (isGameover) return

  const angle = Math.atan2(event.clientY - playerY, event.clientX - playerX)
  const velocity = {
    x: Math.cos(angle) * projectileAccelerator,
    y: Math.sin(angle) * projectileAccelerator,
  }

  projectiles.push(
    new Projectile(playerX, playerY, projectileRadius, 'white', velocity)
  )

  // play fire effect audio
  new Audio('/music/shoot.mp3').play()
})
