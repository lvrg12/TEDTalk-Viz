var container, camera, scene, clock, controls;
var raycaster, mouse, pointer;
var cameraHolder;

init();
animate();

function init()
{
    container = document.createElement( 'div' );
    document.getElementById("parallelCoordinates").appendChild( container );

    initScene();
    initCamera();
    initInteractions();

    initParallelSet();

    // window.addEventListener( 'mousedown', onMouseDown, false );
    // window.addEventListener( 'touchstart', onDocTouch, false );
    // window.addEventListener( 'touchend', onDocRelease, false );

    function onMouseDown( event )
    {
        event.preventDefault();
        var rect = renderer.domElement.getBoundingClientRect();

        mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
        mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

        if( !VR )
            raycaster.setFromCamera( mouse, camera );
        else
            raycaster.setFromCamera( new THREE.Vector2( 0, 0 ) , camera );

        var intersects = raycaster.intersectObjects( chart.group.children );

        if ( intersects.length > 0 )
        {
            if ( INTERSECTED != intersects[ 0 ].object )
            {
                INTERSECTED = intersects[ 0 ].object;
                var itype = INTERSECTED.geometry.type;
                
                if( FILTERED == 0 )
                {
                    if( itype == "CylinderGeometry" | itype == "ExtrudeGeometry" )
                    {

                        FILTERED = 1;

                        var ifield1 = INTERSECTED.attributes.field1;
                        var ifield2 = INTERSECTED.attributes.field2;
                        var ioption1 = INTERSECTED.attributes.option1;
                        var ioption2 = INTERSECTED.attributes.option2;

                        resetChart([ifield1,ioption1,ifield2,ioption2]);

                    }
                }
            }
        }
        else
        {
            if( FILTERED != 0 )
            {
                resetChart(null);
            }
            FILTERED = 0;
        }
    }

    function onDocTouch( event )
    {
        if( VR )
        {
            event.preventDefault();
            TIMER = setInterval( function()
                                    {
                                        camera.translateZ( -10 );
                                    } , 10);
        }
    }

    function onDocRelease( event )
    {
        if( TIMER ) clearInterval(TIMER);
    }

}

function initCamera()
{
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

function initScene()
{
    scene = document.querySelector('a-scene').object3D;
    scene.name = "hpcc";
}

function initInteractions()
{
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}

function initParallelSet()
{
    var FONT = 'media/font/helvetiker_regular.typeface.json';

    var startField = "year";
    var binFields = [];
    var ignoreFields = [];
    var csv = loadFile( "data/tedmaintest.csv" );

    // var startField = "class";
    // var binFields = [];
    // var ignoreFields = "";
    // var csv = loadFile( "data/titanic.csv" );

    var table = new ProcessedTable( startField, ignoreFields, binFields, csv );

    var parallel_set = new ParallelSet( 0.25, FONT, table, startField, ignoreFields, binFields );
    scene.add( parallel_set.graph );

    function loadFile( file )
    {
        var tmp = $.csv.toArrays($.ajax({
            url: file,
            async: false,
            success: function (csvd) { data = $.csv.toArrays(csvd); },
            dataType: "text",
        }).responseText);

        // console.log(tmp);

        return tmp;
    }

    function ProcessedTable( startFieldName, ignoreFields, binFields, table)
    {
        this.type = "ProcessedTable";

        // lowering case of feature names
        for(var i=0; i<table[0].length; i++)
            table[0][i] = table[0][i].toLowerCase();


        // removing ignoreFields from table
        for( var i=0; i<ignoreFields.length; i++)
        {
            var index = table[0].indexOf(ignoreFields[i]);
            for( var j=0; j<table.length; j++)
                table[j].splice(index, 1);
        }

        // binning fields
        if( binFields.length > 0 )
        {
            var min_max = [];
            for( var i=0; i<binFields.length; i++ )
            {
                var index = table[0].indexOf(binFields[i][0]);
                min_max.push( [ parseInt(table[1][index]), parseInt(table[1][index]) ] );

                for(var j=1; j<table.length; j++)
                {
                    var num = parseInt(table[j][index]);

                    if( num < min_max[i][0] )
                        min_max[i][0] = num;

                    if( num > min_max[i][1] )
                        min_max[i][1] = num;
                }
            }


            for( var i=0; i<binFields.length; i++ )
            {
                var index = table[0].indexOf(binFields[i][0]);

                var range = min_max[i][1] - min_max[i][0];

                var interval = [];

                var interval1 = range / 4 + min_max[i][0];
                var interval2 = 2 * (range / 4) + min_max[i][0];
                var interval3 = 3 * (range / 4) + min_max[i][0];

                for( var k=1; k<binFields[i][1]; k++ )
                {
                    interval.push( k * (range / binFields[i][1]) + min_max[i][0])
                }

                for(var j=1; j<table.length; j++)
                {
                    var num = parseInt(table[j][index]);
                    var bin = getInterval(num);
                    // var bin = ( num < interval1 ) ? "low" : ( num < interval2 ) ? "medium-low" : ( num < interval3 ) ? "medium-high" : "high";
                    table[j][index] = bin;
                }

                function getInterval( num )
                {
                    var x = 0;

                    while( x < interval.length )
                    {
                        if( num < interval[x] )
                            return "interval " + (x+1);
                        
                        x++;
                    }
                    return "interval " + x;
                }
            }
        }

        // moving startField to index 0
        if( startFieldName != table[0][0] )
        {
            var index = table[0].indexOf(startFieldName);
            var tmp;
            for( var r=0; r<table.length; r++ )
            {
                tmp = table[r][0];
                table[r][0] = table[r][index];
                table[r][index] = tmp;
            }
        }

        return table;

    }
}

// Animate & Render

function animate()
{
    requestAnimationFrame( animate );
}