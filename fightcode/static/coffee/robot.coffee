class SampleRobot
    onIdle: (ev) ->
        # console.log('onIdle', ev)
        robot = ev.robot
        # if robot.id == 'element6'
            # robot.ahead(1)

    onRobotCollision: (ev) ->
        console.log('onRobotCollision', ev)

    onWallCollision: (ev) ->
        # console.log('onWallCollision', ev)

    onScannedRobot: (ev) ->
        # console.log('onScannedRobot', ev)
        robot = ev.robot
        robot.fire(1)

    onHitByBullet: (ev) ->
        # console.log('onHitByBullet', ev, ev.bulletBearing)
        # robot = ev.robot
        # robot.turn(270 - ev.bulletBearing)
