let inputEnabled = true;
let score = 0;

function showInstructions() {
  document.getElementById("instructions").style.display = "block";
}

function hideInstructions() {
  document.getElementById("instructions").style.display = "none";
}
function disableInput() {
  inputEnabled = false;
}

function enableInput() {
  inputEnabled = true;
}

function initializeGame() {
  moveCount = 0;
  document.getElementById("moves").textContent = moveCount;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("Start-new-game").addEventListener("click", () => {
    document.getElementById("Starter-page").style.display = "none"; initializeGame(numberOfDisks);
  });
  document.getElementById("Restart-button").addEventListener("click", function () {
    location.reload();
  });
  document.body.classList.add("active-sunset");
  setTimeout(function () {
    document.body.classList.remove("active-sunset");
  }, 4000);
  document.getElementById("How-to-Play-button").addEventListener("click", () => {
    showInstructions();
    disableInput(); 
  });

  document.getElementById("Return-button").addEventListener("click", () => {
    hideInstructions();
    enableInput();
  });
  
  initializeGame(numberOfDisks);

  moveCount = 0;

  document.getElementById("moves").textContent = moveCount;

  document.getElementById("Play-again-button").addEventListener("click", () => initializeGame(numberOfDisks)); initializeGame(numberOfDisks);
  let moveCount = 0;
  const moveCounter = document.getElementById("moves");
});

function Canvas(canvas_id) {
  this.canvas_id = canvas_id;
  this.recreate();
}

Canvas.prototype.load_canvas = function() {
  this.canvas = document.getElementById(this.canvas_id);
  this.ctx = this.canvas.getContext('2d');
}

Canvas.prototype.set_width = function(width) {
  this.canvas.width = this.width = biggest(window.innerWidth, width);
}

Canvas.prototype.set_height = function(height) {
  this.canvas.height = this.height = height;
}

Canvas.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}
Canvas.prototype.recreate = function() {
  this.load_canvas();
  var canvas_prime = this.canvas.cloneNode(false);
  this.canvas.parentNode.replaceChild(canvas_prime, this.canvas);
  this.load_canvas();
}

function Colour(rgb) {
  this.rgb = rgb;
}

Colour.prototype.toString = function() {
  return 'rgb(' + this.rgb.join() + ')';
}
Colour.random = function() {
  return Colour.convert_hsv_to_rgb([random_int(0, 359),  random_int(40, 80)/80, random_int(40, 80)/80]);
}
Colour.random_alternative = function() {
  var rgb = [random_int(0, 127), random_int(64, 192), random_int(128, 255)];
  shuffle(rgb);
  return new Colour(rgb);
}
Colour.convert_hsv_to_rgb = function(hsv) {

  var h = hsv[0], s = hsv[1], v = hsv[2];
  h = (h/60) % 6;
  var h_i = Math.floor(h);
  var f = h - h_i;
  var p = v*(1 - s);
  var q = v*(1 - f*s);
  var t = v*(1 - (1 - f)*s);

  switch(h_i) {
    case 0:
      var rgb = [v, t, p];
      break;
    case 1:
      var rgb = [q, v, p];
      break;
    case 2:
      var rgb = [p, v, t];
      break;
    case 3:
      var rgb = [p, q, v];
      break;
    case 4:
      var rgb = [t, p, v];
      break;
    case 5:
      var rgb = [v, p, q];
      break;
  }
  return new Colour(rgb.map(function(a) { return Math.round(a*256); }));
}
function Debug() {
  this.output = document.getElementById('debug');
}

Debug.prototype.msg = function(message) {
  this.output.innerHTML += '<p>' + message + '</p>';
}

Debug.prototype.clear = function() {
  this.output.innerHTML = '';
}
function Disk(tower, width, colour) {
  this.colour = colour;
  this.width = width;
  this.height = Disk.height;
  this.transfer_to_tower(tower);
}


Disk.height = 13;

Disk.prototype.move_to = function(point) {
  this.position = point;
  this.centre = new Point(this.position.x + this.width/2, this.position.y + this.height/2);
}

Disk.prototype.transfer_to_tower = function(destination) {
  var top_disk = destination.get_top_disk();

  if(top_disk && top_disk.width < this.width) destination = this.tower;;

  if(this.tower) this.tower.remove_disk(this);
  this.move_to(new Point(destination.position.x + (destination.base.width - this.width)/2,
  destination.disks_top - this.height));
  destination.add_disk(this);
  this.tower = destination;

  this.on_disk_transferred();
}

Disk.prototype.draw = function() {
  this.tower.ctx.beginPath();
  this.tower.ctx.rect(this.position.x, this.position.y, this.width, this.height);
  this.tower.ctx.closePath();

  this.tower.ctx.save();
  this.tower.ctx.fillStyle = this.colour;
  this.tower.ctx.fill();
  this.tower.ctx.restore();
}

Disk.prototype.is_clicked_on = function(point) {
  return point.x >= this.position.x  &&
  point.x <  this.position.x + this.width &&
  point.y >= this.position.y &&
  point.y <  this.position.y + this.height;
}

Disk.prototype.is_top_disk = function() {
  return this == this.tower.get_top_disk();
}

Disk.prototype.toString = function() {
  return 'Disk(width=' + this.width + ', colour=' + this.colour + ')'
}
Disk.prototype.on_disk_transferred = function() { }
function ElementCoordinateFinder(element) {
  this.element = element;
}

ElementCoordinateFinder.prototype.get_mouse_coordinates = function(event) {
  return new Point(event.pageX - this.get_offset_x(), event.pageY - this.get_offset_y());
}

ElementCoordinateFinder.prototype.get_offset = function(type) {
  var offset_property = (type == 'x' ? 'offsetLeft' : 'offsetTop');
  var result = this.element[offset_property];
  for(var parent = this.element; parent = parent.offSetParent; parent != null) {
    result += parent[offset_property];
  }
  return result;
}

ElementCoordinateFinder.prototype.get_offset_x = function() {
  return this.get_offset('x');
}

ElementCoordinateFinder.prototype.get_offset_y = function() {
  return this.get_offset('y');
}
function GameState(tower_manager) {
  this.tower_manager = tower_manager;
  this.connect_to_disks();
  this.last_complete_tower = this.find_complete_tower();
}

GameState.prototype.on_disk_transferred = function() {
  var complete_tower = this.find_complete_tower();
  if(complete_tower && complete_tower != this.last_complete_tower) {
    this.last_complete_tower = complete_tower;
    this.on_victory();
  }
}

GameState.prototype.find_complete_tower = function() {
  var towers = this.tower_manager.towers;
  for(var i in towers) {
    if(towers[i].disks.length == this.count_total_disks()) return towers[i];
  }
}

GameState.prototype.count_total_disks = function() {
  return this.tower_manager.get_all_disks().length;
}

GameState.prototype.connect_to_disks = function() {
  var disks = this.tower_manager.get_all_disks();
  var self = this;
  for(var i in disks) {
     disks[i].on_disk_transferred = function() { self.on_disk_transferred(); }
  }
}
GameState.prototype.on_victory = function() { }
function Game(disks_count) {
  this.start_new(disks_count);
}

Game.prototype.start_new = function(disks_count) {
  debug.msg('New game');

  var canvas = new Canvas('canvas');
  var tower_manager = new TowerUp (canvas, disks_count);
  var input_handler = new InputHandler(canvas.ctx, tower_manager);
  var game_state = new GameState(tower_manager, input_handler);
  var end_page = new EndPage(input_handler);
  game_state.on_victory = function() { end_page.on_victory(); }

  tower_manager.draw();
}
function init() {
  debug = new Debug(); 
  new Game(3);
  document.getElementById('Start-new-game').addEventListener('click', function() {
    document.getElementById('Start-page').style.display = 'none';
  }, false);
}
window.addEventListener('load', init, false);
function InputHandler(ctx, tower_manager) {
  this.ctx = ctx;
  this.tower_manager = tower_manager;
  this.canvas = ctx.canvas;
  this.coordinate_finder = new ElementCoordinateFinder(this.canvas);
  this.add_event_listeners();
  this.enable_input();
}

InputHandler.prototype.add_event_listeners = function() {
  debug.msg('Adding event listeners');
  var self = this;
  this.canvas.addEventListener('mousedown', function(event) { self.on_canvas_mousedown(event); }, false);
  this.canvas.addEventListener('mousemove', function(event) { self.on_canvas_mousemove(event); }, false);
  this.canvas.addEventListener('mouseup',   function(event) { self.on_canvas_mouseup(event); },   false);
}

InputHandler.prototype.on_canvas_mousedown = function(event) {
  if(!this.allow_input) return;
  var coords = this.coordinate_finder.get_mouse_coordinates(event);
  this.disk = this.tower_manager.get_clicked_disk(coords);
  if(!this.disk || !this.disk.is_top_disk()) return;

  this.mouse_delta = coords.subtract(this.disk.position);
  this.dragging = true;
}

InputHandler.prototype.on_canvas_mousemove = function(event) {
  if(!this.dragging) return;
  var coords = this.coordinate_finder.get_mouse_coordinates(event);
  this.disk.move_to(coords.subtract(this.mouse_delta));
  this.tower_manager.draw();
  this.show_distance_to_each_tower();

  move++;
  moveCounter.textContent = moveCount;
}


InputHandler.prototype.show_distance_to_each_tower = function() {
  debug.clear();
  debug.msg('Distance to tower 1: ' + this.disk.centre.distance_to(this.tower_manager.towers[0].top));
  debug.msg('Distance to tower 2: ' + this.disk.centre.distance_to(this.tower_manager.towers[1].top));
  debug.msg('Distance to tower 3: ' + this.disk.centre.distance_to(this.tower_manager.towers[2].top));
}

InputHandler.prototype.on_canvas_mouseup = function(event) {
  if(!this.dragging) return;
  this.dragging = false;
  var closest_tower = this.tower_manager.find_closest_tower(this.disk.centre);
  this.disk.transfer_to_tower(closest_tower);
  this.tower_manager.draw();
  score++;

  document.getElementById("moves").textContent = score;
}

InputHandler.prototype.disable_input = function() {
  debug.msg('Input disabled');
  this.allow_input = false;
}

InputHandler.prototype.enable_input = function() {
  debug.msg('Input enabled');
  this.allow_input = true;
}
function random_int(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function shuffle(arr) {
  arr.sort(function(a, b) { return Math.random() - 0.5; });
}

function biggest(a, b) {
  return a > b ? a : b;
}
function Point(x, y) {
  this.x = x;
  this.y = y;
}
Point.prototype.subtract = function(point) {
  return new Point(this.x - point.x, this.y - point.y);
}

Point.prototype.distance_to = function(other) {
  return Math.sqrt(Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y, 2));
}

Point.prototype.toString = function() {
  return '(' + this.x + ', ' + this.y + ')';
}
function TowerUp(canvas, disks_count) {
  this.canvas = canvas;
  this.disks_count = parseInt(disks_count, 10);
  this.towers_count = 3;
  this.create_towers();
  this.add_initial_disks();
}

TowerUp.prototype.add_initial_disks = function() {
  var disk_widths = this.calculate_disk_widths();
  while(width = disk_widths.pop()) new Disk(this.towers[0], width, Colour.random().toString());
}

TowerUp.prototype.draw = function() {
  this.canvas.clear();
  for(i in this.towers) {
    this.towers[i].draw();
  }
}

TowerUp.prototype.create_towers = function() {
  this.towers = [];
  var base_width = this.calculate_disk_widths().pop() + 30;
  var stem_height = this.disks_count*Disk.height + 40;
  var base_horizontal_separation = biggest(16, base_width/10);
  var horizontal_padding = 42;
  var vertical_padding = 80;
  var towers_width = base_width*this.towers_count + base_horizontal_separation*(this.towers_count - 1);
  this.canvas.set_width(towers_width + 2*horizontal_padding);
  var x = (this.canvas.width - towers_width)/2;

  for(var i = 0; i < this.towers_count; i++) {
    var tower = new Tower(new Point(x, vertical_padding), base_width, stem_height, this.canvas.ctx);
    this.towers.push(tower);
    x += base_width + base_horizontal_separation;
  }
  this.canvas.set_height(this.towers[0].height + 2*vertical_padding);
}

TowerUp.prototype.calculate_disk_widths = function() {
  var disk_widths = [];
  var width = 65;
  for(var i = 0; i < this.disks_count; i++) {
    disk_widths.push(width += 20);
  }
  return disk_widths;
}

TowerUp.prototype.get_clicked_disk = function(point) {
  var disks = this.get_all_disks();
  for(i in disks) {
    if(disks[i].is_clicked_on(point)) return disks[i];
  }
}

TowerUp.prototype.get_all_disks = function() {
  var disks = [];
  for(i in this.towers) disks = disks.concat(this.towers[i].disks);
  return disks;
}

TowerUp.prototype.find_closest_tower = function(point) {
  var distances = [];
  for(i in this.towers) {
    distances.push({'tower':    this.towers[i],
  'distance': this.towers[i].top.distance_to(point)});
  }
  distances.sort(function(a, b) { return a.distance - b.distance; });
  return distances[0]['tower'];
}


TowerUp.prototype.toString = function() {
  return 'TowerUp( ' + this.towers + ' )';
}
function Tower(position, base_width, stem_height, ctx) {
  this.position = position;
  this.ctx = ctx;
  this.disks = [];

  this.base = {'width': base_width, 'height': 20};
  this.stem = {'width': 30, 'height': stem_height};
  this.height = this.base.height + this.stem.height;
  this.base.position = new Point(this.position.x, this.position.y + this.stem.height);
  this.stem.position = new Point(this.position.x + (this.base.width/2 - this.stem.width/2), this.position.y);
  this.top = new Point(this.stem.position.x + this.stem.width/2, this.stem.position.y);
  this.disks_top = this.base.position.y;
}

Tower.prototype.toString = function() {
  return 'Tower(x=' + this.position.x + ', y=' + this.position.y + ')';
}

Tower.prototype.add_disk = function(disk) {
  this.disks.push(disk);
  this.disks_top -= disk.height;
}

Tower.prototype.remove_disk = function(disk) {
  this.disks.splice(this.disks.indexOf(disk), 1);
  this.disks_top += disk.height;
}

Tower.prototype.draw = function() {
  this.draw_self();
  this.draw_disks();
}

Tower.prototype.draw_self = function() {
  this.ctx.save();
  this.ctx.globalCompositeOperation = 'destination-over';
  this.ctx.beginPath();
  this.ctx.rect(this.base.position.x, this.base.position.y, this.base.width, this.base.height);
  this.ctx.rect(this.stem.position.x, this.stem.position.y, this.stem.width, this.stem.height);
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.restore();
}

Tower.prototype.draw_disks = function() {
  for(i in this.disks)
    this.disks[i].draw();
}

Tower.prototype.get_top_disk = function() {
  return this.disks[this.disks.length - 1];
}
function EndPage(input_handler) {
  this.input_handler = input_handler;
}

EndPage.prototype.on_victory = function() {
  this.input_handler.disable_input();

  var end_page = document.getElementById('End-page');
  end_page.style.display = 'block';
  document.getElementById('Play-again-button').addEventListener('click', function() {
      end_page.style.display = 'none';
      new Game(document.getElementById('disks-count-number').value);
  }, false);
};

