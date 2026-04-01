---
layout: page
title: "M.A.R.C.U.S."
---

# M.A.R.C.U.S.

**Multiple Amazing Robot Code Usage Selector**

M.A.R.C.U.S. is a reusable robot programming framework for [FIRST LEGO League](https://www.firstlegoleague.org/) competitions, written in Python using the [Pybricks](https://pybricks.com/) library. It runs directly on the LEGO SPIKE Prime hub and provides a menu-driven system for selecting and running mission programs during competition.

M.A.R.C.U.S. was created by Lucas Plaisted, a WCCA Robotics member who built an early version of the menu system during the 2024–25 Submerged season while competing on our FLL team, Marcus Bartholomew the Third Junior. Now on our FTC team, Lucas developed M.A.R.C.U.S. as a polished, reusable framework that any FLL team can use. Both of our FLL teams use it this season.

<a href="https://github.com/lsplaisted/marcus" class="btn btn-blue">View on GitHub →</a>

---

## Features

### Menu System
A hub-button-driven program selector — no screen or app required. Left/right to browse, center to run. The hub's 5×5 LED matrix shows the current program number so you always know what's selected.

### One Button Launch
After a program finishes, M.A.R.C.U.S. automatically advances the selection to the next program. A single button press is all you need to launch it — helping your technicians get the robot running more quickly during competitions.

### Celebration
When the last mission finishes, M.A.R.C.U.S. plays a celebration! It shows a blinking star on the display and plays the Mario level completed tune.

### Utilities
Press the Bluetooth button to enter or exit a utility menu with handy tools:
- **Wheel cleaning** — runs the wheels continuously, making it easier to clean them with a wipe
- **Battery check** — shows the percentage of battery remaining directly on the robot
- **Celebration** — demo the celebration animation
- **Drive straight with gyro** — great for demoing gyro functionality to judges during your robot design presentation. You can demonstrate how the robot corrects its heading if knocked off course.

### Force Sensor Launch
If your hub is oriented such that the center button is difficult to reach, you can use a SPIKE Prime force sensor to launch the current program instead.

### Easy Program Setup
Each mission program is a simple Python file with a `Run` function. To add a new mission, create a `programN.py` file and add it to the programs list in `main_program.py` — that's it.

### Works with Pybricks Block Programming
M.A.R.C.U.S. bridges the gap between block programming and multi-program management — something that's been a challenge for FLL teams using Pybricks. You can create and test your mission programs using Pybricks block programming, then view the Python equivalent in Pybricks, copy the body of the code into a Python file in VS Code, and run it with M.A.R.C.U.S. This gives teams the accessibility of block programming with the power of a full menu system for competition.

### Robot Configuration
All hardware setup lives in one `robot.py` file — tire diameter, axle track, motor ports, directions, and optional sensors. When the physical robot changes, you only need to update one place.

---

## How It Works

When you turn on the robot, M.A.R.C.U.S. displays a menu on the SPIKE Prime hub's LED matrix. Use the **left** and **right** buttons to scroll through numbered mission programs, then press the **center** button (or the force sensor) to run the selected program.

Press **center** while a program is running to stop it safely. Press **center + Bluetooth** together to shut down the whole system.

---

## Architecture

```
main_program.py      ← Entry point: registers programs and launches the menu
robot.py             ← Robot hardware config (motors, sensors, dimensions)
program1.py          ← Mission program 1
program2.py          ← Mission program 2
...
marcus/
  menu.py            ← Menu system and program runner
  buttons.py         ← Button input with edge/hold detection
  images.py          ← LED matrix sprite constants
  celebrate.py       ← Victory celebration animation
  clean_wheels.py    ← Wheel cleaning utility
  battery.py         ← Battery level check
  straight.py        ← Straight-driving demo
```

The **root folder** contains team-specific files that change each season — your mission programs and robot configuration. The **`marcus/` subfolder** contains the reusable M.A.R.C.U.S. infrastructure that rarely needs editing.

---

## Getting Started

1. Copy the M.A.R.C.U.S. code into your project
2. Install [uv](https://docs.astral.sh/uv/) and run `uv sync` for type-checking support
3. Install VS Code with the **Python** and **BlocklyPy** extensions
4. Update `robot.py` for your robot's hardware:
   - Set `TIRE_DIAMETER` and `AXLE_TRACK`
   - Configure motor ports and directions
5. Write your mission programs as `programN.py` files with a `Run` function
6. Import them in `main_program.py` and add to the `programs` list
7. Deploy to the hub using [Pybricks firmware](https://pybricks.com/) and the BlocklyPy extension

---

*M.A.R.C.U.S. is open source and available for any FLL team to use. Check out the [GitHub repository](https://github.com/lsplaisted/marcus) to get started!*
