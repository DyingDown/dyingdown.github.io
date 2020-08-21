new Vue({
    el: '#wrap',
    data() {
        return {
            count: 3,
            side: 50,
            blocks: [],
            contentRotate: {
                x: -30,
                y: 30
            },
            transition: 0
        }
    },
    created() {
        this.getBlocks()
        document.onkeydown = (event) => {
            if (event.keyCode === 37) {
                this.contentRotate.y--
            } else if (event.keyCode === 39) {
                this.contentRotate.y++
            } else if (event.keyCode === 38) {
                this.contentRotate.x++
            } else if (event.keyCode === 40) {
                this.contentRotate.x--
            }
        }
        document.onmousemove = (event) => {
                this.contentRotate.y += event.clientY - (event.clientY - event.target.offsetTop);
                this.contentRotate.x += event.clientX - (event.clientX - event.target.offsetLeft);
            }
            // document.onmouseup = (event) => {
            //     document.onmousemove = null;
            //     document.onmouseup = null;
            // }
    },
    methods: {
        getBlocks() {
            for (let x = 0; x < this.count; x++) {
                for (let y = 0; y < this.count; y++) {
                    for (let z = 0; z < this.count; z++) {
                        const block = {
                            x: x,
                            y: y,
                            z: z,
                            rotate: {
                                x: 0,
                                y: 0,
                                z: 0
                            },
                            areas: this.getAreas(x, y, z)
                        }
                        this.blocks.push(block)
                    }
                }
            }
        },
        getAreas(x, y, z) {
            const areas = []
            if (x === 0) {
                areas.push(this.createArea('left', x, y, z, 1))
            } else
                areas.push(this.createArea('left', x, y, z, 0))
            if (x === this.count - 1) {
                areas.push(this.createArea('right', x, y, z, 1))
            } else
                areas.push(this.createArea('right', x, y, z, 0))
            if (y === 0) {
                areas.push(this.createArea('up', x, y, z, 1))
            } else {
                areas.push(this.createArea('up', x, y, z, 0))
            }
            if (y === this.count - 1) {
                areas.push(this.createArea('down', x, y, z, 1))
            } else {
                areas.push(this.createArea('down', x, y, z, 0))
            }
            if (z === 0) {
                areas.push(this.createArea('front', x, y, z, 1))
            } else {
                areas.push(this.createArea('front', x, y, z, 0))
            }
            if (z === this.count - 1) {
                areas.push(this.createArea('back', x, y, z, 1))
            } else {
                areas.push(this.createArea('back', x, y, z, 0))
            }
            return areas
        },
        getAreaTransform(direct) {
            const transform = {
                up: 'translateY(-' + this.side + 'px) rotateX(90deg)',
                down: 'translateY(' + this.side + 'px) rotateX(-90deg)',
                left: 'translateX(-' + this.side + 'px) rotateY(-90deg)',
                right: 'translateX(' + this.side + 'px) rotateY(90deg)',
                front: 'translateZ(0px)',
                back: 'translateZ(-' + this.side + 'px)'
            }
            return transform[direct];
        },
        createArea(direct, x, y, z, flag) {
            const colors1 = {
                up: 'white',
                down: 'white',
                left: 'white',
                right: 'white',
                front: 'white',
                back: 'white'
            }
            const colors = {
                up: 'yellow',
                down: 'white',
                left: '#00477d',
                right: 'green',
                front: 'red',
                back: '#ffa500'
            }
            if (flag === 1)
                return {
                    direct: direct,
                    transform: this.getAreaTransform(direct),
                    color: colors[direct]
                }
            else
                return {
                    direct: direct,
                    transform: this.getAreaTransform(direct),
                    color: colors1[direct]
                }
        },
        down(event, area, block) {
            if (event.which !== 1) return false;
            event.preventDefault()
            const x = block.x
            const y = block.y
            const z = block.z
            const startX = event.pageX || event.clientX;
            const startY = event.pageY || event.clientY;
            document.onmouseup = (e) => {
                this.transition = 1;
                const endX = e.pageX || e.clientX;
                const endY = e.pageY || e.clientY;
                const diffX = endX - startX;
                const diffY = endY - startY;
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    if (area.direct === 'front' || area.direct === 'back' || area.direct === 'left' || area.direct === 'right')
                        this.rotatey(x, y, z, diffX)
                    else
                        this.rotatez(x, y, z, diffX)
                } else {
                    if (area.direct === 'left')
                        this.rotatez(x, y, z, -diffY)
                    else if (area.direct === 'right')
                        this.rotatez(x, y, z, diffY)
                    else if (area.direct === 'back')
                        this.rotatex(x, y, z, -diffY)
                    else
                        this.rotatex(x, y, z, diffY)
                }
                document.onmouseup = null
            }
        },
        rotatey(x, y, z, diffx) {
            for (let i = 0; i < this.blocks.length; i++) {
                if (this.blocks[i].y === y) {
                    const oldX = this.blocks[i].x
                    const oldZ = this.blocks[i].z
                    if (diffx > 0) {
                        this.blocks[i].rotate.y += 90;
                        setTimeout(() => {
                            this.transition = 0;
                            this.blocks[i].z = oldX;
                            this.blocks[i].x = this.count - 1 - oldZ;
                            this.blocks[i].rotate.y = 0
                            for (let j = 0; j < this.blocks[i].areas.length; j++) {
                                if (this.blocks[i].areas[j].direct === 'left') {
                                    this.blocks[i].areas[j].direct = 'front'
                                } else if (this.blocks[i].areas[j].direct === 'front') {
                                    this.blocks[i].areas[j].direct = 'right'
                                } else if (this.blocks[i].areas[j].direct === 'right') {
                                    this.blocks[i].areas[j].direct = 'back'
                                } else if (this.blocks[i].areas[j].direct === 'back') {
                                    this.blocks[i].areas[j].direct = 'left'
                                }
                                this.blocks[i].areas[j].transform = this.getAreaTransform(this.blocks[i].areas[j].direct);
                            }
                        }, 1000)
                    } else {
                        this.blocks[i].rotate.y += -90;
                        setTimeout(() => {
                            this.transition = 0;
                            this.blocks[i].x = oldZ;
                            this.blocks[i].z = this.count - 1 - oldX;
                            this.blocks[i].rotate.y = 0
                            for (let j = 0; j < this.blocks[i].areas.length; j++) {
                                if (this.blocks[i].areas[j].direct === 'left') {
                                    this.blocks[i].areas[j].direct = 'back'
                                } else if (this.blocks[i].areas[j].direct === 'front') {
                                    this.blocks[i].areas[j].direct = 'left'
                                } else if (this.blocks[i].areas[j].direct === 'right') {
                                    this.blocks[i].areas[j].direct = 'front'
                                } else if (this.blocks[i].areas[j].direct === 'back') {
                                    this.blocks[i].areas[j].direct = 'right'
                                }
                                this.blocks[i].areas[j].transform = this.getAreaTransform(this.blocks[i].areas[j].direct);
                            }
                        }, 1000)
                    }
                }
            }
        },
        rotatex(x, y, z, diffy) {
            for (let i = 0; i < this.blocks.length; i++) {
                if (this.blocks[i].x === x) {
                    const oldY = this.blocks[i].y
                    const oldZ = this.blocks[i].z
                    if (diffy > 0) {
                        this.blocks[i].rotate.x += -90;
                        setTimeout(() => {
                            this.transition = 0;
                            this.blocks[i].z = oldY;
                            this.blocks[i].y = this.count - 1 - oldZ;
                            this.blocks[i].rotate.x = 0
                            for (let j = 0; j < this.blocks[i].areas.length; j++) {
                                if (this.blocks[i].areas[j].direct === 'up') {
                                    this.blocks[i].areas[j].direct = 'front'
                                } else if (this.blocks[i].areas[j].direct === 'front') {
                                    this.blocks[i].areas[j].direct = 'down'
                                } else if (this.blocks[i].areas[j].direct === 'down') {
                                    this.blocks[i].areas[j].direct = 'back'
                                } else if (this.blocks[i].areas[j].direct === 'back') {
                                    this.blocks[i].areas[j].direct = 'up'
                                }

                                this.blocks[i].areas[j].transform = this.getAreaTransform(this.blocks[i].areas[j].direct);
                            }
                        }, 1000)
                    } else {
                        this.blocks[i].rotate.x += 90;
                        setTimeout(() => {
                            this.transition = 0;
                            this.blocks[i].y = oldZ;
                            this.blocks[i].z = this.count - 1 - oldY;
                            this.blocks[i].rotate.x = 0
                            for (let j = 0; j < this.blocks[i].areas.length; j++) {
                                if (this.blocks[i].areas[j].direct === 'up') {
                                    this.blocks[i].areas[j].direct = 'back'
                                } else if (this.blocks[i].areas[j].direct === 'front') {
                                    this.blocks[i].areas[j].direct = 'up'
                                } else if (this.blocks[i].areas[j].direct === 'down') {
                                    this.blocks[i].areas[j].direct = 'front'
                                } else if (this.blocks[i].areas[j].direct === 'back') {
                                    this.blocks[i].areas[j].direct = 'down'
                                }
                                this.blocks[i].areas[j].transform = this.getAreaTransform(this.blocks[i].areas[j].direct);
                            }
                        }, 1000)
                    }
                }
            }
        },
        rotatez(x, y, z, diffy) {
            for (let i = 0; i < this.blocks.length; i++) {
                if (this.blocks[i].z === z) {
                    const oldY = this.blocks[i].y
                    const oldX = this.blocks[i].x
                    if (diffy > 0) {
                        this.blocks[i].rotate.z += 90;
                        setTimeout(() => {
                            this.transition = 0;
                            this.blocks[i].y = oldX;
                            this.blocks[i].x = this.count - 1 - oldY;
                            this.blocks[i].rotate.z = 0
                            for (let j = 0; j < this.blocks[i].areas.length; j++) {
                                if (this.blocks[i].areas[j].direct === 'up') {
                                    this.blocks[i].areas[j].direct = 'right'
                                } else if (this.blocks[i].areas[j].direct === 'right') {
                                    this.blocks[i].areas[j].direct = 'down'
                                } else if (this.blocks[i].areas[j].direct === 'down') {
                                    this.blocks[i].areas[j].direct = 'left'
                                } else if (this.blocks[i].areas[j].direct === 'left') {
                                    this.blocks[i].areas[j].direct = 'up'
                                }

                                this.blocks[i].areas[j].transform = this.getAreaTransform(this.blocks[i].areas[j].direct);
                            }
                        }, 1000)
                    } else {
                        this.blocks[i].rotate.z += -90;
                        setTimeout(() => {
                            this.transition = 0;
                            this.blocks[i].x = oldY;
                            this.blocks[i].y = this.count - 1 - oldX;
                            this.blocks[i].rotate.z = 0
                            for (let j = 0; j < this.blocks[i].areas.length; j++) {
                                if (this.blocks[i].areas[j].direct === 'up') {
                                    this.blocks[i].areas[j].direct = 'left'
                                } else if (this.blocks[i].areas[j].direct === 'left') {
                                    this.blocks[i].areas[j].direct = 'down'
                                } else if (this.blocks[i].areas[j].direct === 'down') {
                                    this.blocks[i].areas[j].direct = 'right'
                                } else if (this.blocks[i].areas[j].direct === 'right') {
                                    this.blocks[i].areas[j].direct = 'up'
                                }
                                this.blocks[i].areas[j].transform = this.getAreaTransform(this.blocks[i].areas[j].direct);
                            }
                        }, 1000)
                    }
                }
            }
        }
        // rotate = (e) => {
        //     let x = 0,
        //         y = 0,
        //         l = 0,
        //         r = 0;
        //     let isDown = false;
        //     this.onmousedown =
        // }
    }
})