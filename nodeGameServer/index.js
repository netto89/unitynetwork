var app = require('express')()
var server = require('http').Server(app)
var io = require('socket.io')(server)

server.listen(3000)

app.get('/', function(req, res) {
    res.send('hey you got back a get ')
})


var clients = []
var enemies = []
var playerSpawnPoints = []

io.on('connection', function(socket) {

    var currentPlayer = {}
    currentPlayer.name = 'unkown'

    socket.on('player connect', function() {
        console.log(currentPlayer.name + ' recv: player connect')
        for(var i = 0; i < clients.length; i++){
            socket.emit('other player connected', clients[i])
        }

    })

    socket.on('play', function(data){
        console.log(currentPlayer.name + ' recv: play: ' + JSON.stringify(data))
        if(clients.length === 0) {
            numberOfEnemies = data.enemySpawnPoints.length
            data.enemySpawnPoints.forEach(function(enemySpawnPoint){
                var enemy = {
                    name: guid(),
                    position: enemySpawnPoint.position,
                    rotation: enemySpawnPoint.rotation,
                    health: 100
                }
                enemies.push(enemy)
            })
            data.playerSpawnPoints.forEach(function(_playerSpawnPoints) {
                var playerSpawnPoint = {
                    position: _playerSpawnPoints.position,
                    rotation: _playerSpawnPoints.rotation
                }
                playerSpawnPoints.push(playerSpawnPoint)
            })
        }
        var enemiesResponse = {enemies}

        socket.emit('enemies', enemiesResponse)
        var randomSpawnPoint = playerSpawnPoints[Math.floor(Math.random() * playerSpawnPoints.length)]
        currentPlayer = {
            name: data.name,
            position: randomSpawnPoint.position,
            rotation: randomSpawnPoint.rotation,
            health: 100
        }
        clients.push(currentPlayer)

        socket.emit('play', currentPlayer)
        socket.broadcast.emit('other player connected', currentPlayer)
    })

    socket.on('player move', function(data){
        console.log('recv: move: ' + JSON.stringify(data))
        currentPlayer.position = data.position
        socket.broadcast.emit('player move', currentPlayer)
    })

    socket.on('player turn', function(data){
        console.log('recv: turn: ' + JSON.stringify(data))
        currentPlayer.rotation = data.rotation
        socket.broadcast.emit('player turn', currentPlayer)
    })

    socket.on('player shoot', function(){
        console.log(currentPlayer.name + ' recv: shoot')
        var data = {
            name: currentPlayer.name
        }
        socket.emit('player shoot', data)
        socket.broadcast.emit('player shoot', data)
    })

    socket.on('health', function(data){
        console.log('recv: health: ' + JSON.stringify(data))
        if(data.from === currentPlayer.name){
            var indexDamaged = 0;
            if(!data.isEnemy) {
                client = clients.map(function(client, index) {
                    if(client.name === data.name) {
                        indexDamaged = index;
                        client.health -= data.healthChange
                    }
                    return client
                })
            } else {
                enemies = enemies.map(function(enemy, index) {
                    if(enemy.name == data.name){
                        indexDamaged = index
                        enemy.health -= data.healthChange
                    }
                    return enemy
                })
            }

            var response = {
                name: !data.isEnemy ? clients[indexDamaged].name : enemies[indexDamaged].name,
                health: !data.isEnemy ? clients[indexDamaged].health : enemies[indexDamaged].health
            }
            socket.emit('health', response)
            socket.broadcast.emit('health', response)
        }
    })

    socket.on('disconnect', function(){
        console.log(currentPlayer.name + ' recv: disconnect')
        socket.broadcast.emit('other player disconnected', currentPlayer)
        for(var i=0; i< clients.length; i++) {
            if(clients[i].name === currentPlayer.name) {
                clients.splice(i, 1)
            }
        }
    })
})

console.log("server runnign: ")

function guid() {
    function s4() {
        return Math.floor((1+Math.random()) * 0x100000).toString(16).substring(1)
    }
    return s4() + s4() + '-' + s4()
}