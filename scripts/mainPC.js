(function () {
    let container, camera, scene, clock, controls;
    let raycaster, mouse, pointer;
    let cameraHolder;

    init();
    animate();

    function init() {
        container = document.createElement('div');
        document.getElementById("parallelCoordinates").appendChild(container);

        initScene();
        initCamera();
        initInteractions();

        initParallelSet();

        // window.addEventListener( 'mousedown', onMouseDown, false );
        // window.addEventListener( 'touchstart', onDocTouch, false );
        // window.addEventListener( 'touchend', onDocRelease, false );

        function onMouseDown(event) {
            event.preventDefault();
            let rect = renderer.domElement.getBoundingClientRect();

            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = - ((event.clientY - rect.top) / rect.height) * 2 + 1;

            if (!VR)
                raycaster.setFromCamera(mouse, camera);
            else
                raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

            let intersects = raycaster.intersectObjects(chart.group.children);

            if (intersects.length > 0) {
                if (INTERSECTED != intersects[0].object) {
                    INTERSECTED = intersects[0].object;
                    let itype = INTERSECTED.geometry.type;

                    if (FILTERED == 0) {
                        if (itype == "CylinderGeometry" | itype == "ExtrudeGeometry") {

                            FILTERED = 1;

                            let ifield1 = INTERSECTED.attributes.field1;
                            let ifield2 = INTERSECTED.attributes.field2;
                            let ioption1 = INTERSECTED.attributes.option1;
                            let ioption2 = INTERSECTED.attributes.option2;

                            resetChart([ifield1, ioption1, ifield2, ioption2]);

                        }
                    }
                }
            }
            else {
                if (FILTERED != 0) {
                    resetChart(null);
                }
                FILTERED = 0;
            }
        }

        function onDocTouch(event) {
            if (VR) {
                event.preventDefault();
                TIMER = setInterval(function () {
                    camera.translateZ(-10);
                }, 10);
            }
        }

        function onDocRelease(event) {
            if (TIMER) clearInterval(TIMER);
        }

    }

    function initCamera() {
        cameraHolder = document.querySelector('a-entity').object3D;
        cameraHolder.name = "cameraHolder";

        document.querySelector('a-camera').object3D.name = "hppc_camera_group";
        camera = document.querySelector('a-camera').object3D.children[1];
        camera.type = "hpcc_camera"
        camera.name = "camera";

        pointer = camera.el.lastElementChild.object3D.children[0];

        pointer.material.depthTest = false;
        pointer.name = "pointer";
    }

    function initScene() {
        scene = document.querySelector('a-scene').object3D;
        scene.name = "hpcc";
    }

    function initInteractions() {
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();
    }

    function initParallelSet() {
        let FONT = 'media/font/helvetiker_regular.typeface.json';

        let startField = "year";
        let binFields = [];
        let ignoreFields = [];
        let csv = loadFile("data/tedmaintest.csv");

        // let startField = "class";
        // let binFields = [];
        // let ignoreFields = "";
        // let csv = loadFile( "data/titanic.csv" );

        let table = new ProcessedTable(startField, ignoreFields, binFields, csv);

        let parallel_set = new ParallelSet(0.25, FONT, table, startField, ignoreFields, binFields);
        scene.add(parallel_set.graph);

        function loadFile(file) {
            let tmp = $.csv.toArrays($.ajax({
                url: file,
                async: false,
                success: function (csvd) { data = $.csv.toArrays(csvd); },
                dataType: "text",
            }).responseText);

            // console.log(tmp);

            return tmp;
        }

        function ProcessedTable(startFieldName, ignoreFields, binFields, table) {
            this.type = "ProcessedTable";

            // lowering case of feature names
            for (let i = 0; i < table[0].length; i++)
                table[0][i] = table[0][i].toLowerCase();


            // removing ignoreFields from table
            for (let i = 0; i < ignoreFields.length; i++) {
                let index = table[0].indexOf(ignoreFields[i]);
                for (let j = 0; j < table.length; j++)
                    table[j].splice(index, 1);
            }

            // binning fields
            if (binFields.length > 0) {
                let min_max = [];
                for (let i = 0; i < binFields.length; i++) {
                    let index = table[0].indexOf(binFields[i][0]);
                    min_max.push([parseInt(table[1][index]), parseInt(table[1][index])]);

                    for (let j = 1; j < table.length; j++) {
                        let num = parseInt(table[j][index]);

                        if (num < min_max[i][0])
                            min_max[i][0] = num;

                        if (num > min_max[i][1])
                            min_max[i][1] = num;
                    }
                }


                for (let i = 0; i < binFields.length; i++) {
                    let index = table[0].indexOf(binFields[i][0]);

                    let range = min_max[i][1] - min_max[i][0];

                    let interval = [];

                    let interval1 = range / 4 + min_max[i][0];
                    let interval2 = 2 * (range / 4) + min_max[i][0];
                    let interval3 = 3 * (range / 4) + min_max[i][0];

                    for (let k = 1; k < binFields[i][1]; k++) {
                        interval.push(k * (range / binFields[i][1]) + min_max[i][0])
                    }

                    for (let j = 1; j < table.length; j++) {
                        let num = parseInt(table[j][index]);
                        let bin = getInterval(num);
                        // let bin = ( num < interval1 ) ? "low" : ( num < interval2 ) ? "medium-low" : ( num < interval3 ) ? "medium-high" : "high";
                        table[j][index] = bin;
                    }

                    function getInterval(num) {
                        let x = 0;

                        while (x < interval.length) {
                            if (num < interval[x])
                                return "interval " + (x + 1);

                            x++;
                        }
                        return "interval " + x;
                    }
                }
            }

            // moving startField to index 0
            if (startFieldName != table[0][0]) {
                let index = table[0].indexOf(startFieldName);
                let tmp;
                for (let r = 0; r < table.length; r++) {
                    tmp = table[r][0];
                    table[r][0] = table[r][index];
                    table[r][index] = tmp;
                }
            }

            return table;

        }
    }

    // Animate & Render

    function animate() {
        requestAnimationFrame(animate);
    }
})()