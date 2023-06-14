/**
 * 產生3D鋼琴按鍵
 *
 * @param {BABYLON.Scene} scene 場景物件
 * @param {BABYLON.TransformNode} parent 父類別
 * @param {Object} props 屬性
 * @param {String} props.type 類型(white: 白鍵; black: 黑鍵)
 * @param {String} props.note 音階名稱
 * @param {Float} props.topWidth 頂端部分的寬度(僅為白鍵時使用)
 * @param {Float} props.bottomWidth 底部部分的寬度(僅為白鍵時使用)
 * @param {Float} props.topPositionX 相對於底部部分的上層部分 x 位置(僅為白鍵時使用)
 * @param {Float} props.wholePositionX 相對於暫存器端點的整個索引鍵 x 位置
 * @param {Integer} props.register 註冊金鑰屬於(介於 0 到 8 之間)
 * @param {Float} props.referencePositionX 暫存器端點的 x 座標， (做為參考點)
 * @returns
 */
const buildKey = function (scene, parent, props) {
    if (props.type === "white") {
        // 建立白鍵

        // 將白鍵視為上下兩部分組成
        // 下方
        const bottom = BABYLON.MeshBuilder.CreateBox("whiteKeyBottom", {width: props.bottomWidth, height: 1.5, depth: 4.5}, scene);

        // 上方
        const top = BABYLON.MeshBuilder.CreateBox("whiteKeyTop", {width: props.topWidth, height: 1.5, depth: 5}, scene);
        top.position.z =  4.75;
        top.position.x += props.topPositionX;

        // Merge bottom and top parts
        // Parameters of BABYLON.Mesh.MergeMeshes: (arrayOfMeshes, disposeSource, allow32BitsIndices, meshSubclass, subdivideWithSubMeshes, multiMultiMaterials)
        // 結合兩個mesh成為完成的琴鍵
        const key = BABYLON.Mesh.MergeMeshes([bottom, top], true, false, null, false, false);
        key.position.x = props.referencePositionX + props.wholePositionX;
        key.name = props.note + props.register;
        key.parent = parent;

        return key;
    }
    else if (props.type === "black") {
        // 建立黑鍵

        // Create black color material
        const blackMat = new BABYLON.StandardMaterial("black");
        blackMat.diffuseColor = new BABYLON.Color3(0, 0, 0);

        // 琴鍵
        const key = BABYLON.MeshBuilder.CreateBox(props.note + props.register, {width: 1.4, height: 2, depth: 5}, scene);
        key.position.z += 4.75;
        key.position.y += 0.25;
        key.position.x = props.referencePositionX + props.wholePositionX;
        key.material = blackMat;
        key.parent = parent;

        return key;
    }
}

const createScene = async function(engine) {
    const scene = new BABYLON.Scene(engine);

    const alpha =  3*Math.PI/2;
    const beta = Math.PI/50;
    const radius = 220;
    const target = new BABYLON.Vector3(0, 0, 0);

    const camera = new BABYLON.ArcRotateCamera("Camera", alpha, beta, radius, target, scene);
    camera.attachControl(canvas, true);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.6;

    // 定義琴鍵屬性
    const keyParams = [
        {type: "white", note: "C", topWidth: 1.4, bottomWidth: 2.3, topPositionX: -0.45, wholePositionX: -14.4},
        {type: "black", note: "C#", wholePositionX: -13.45},
        {type: "white", note: "D", topWidth: 1.4, bottomWidth: 2.4, topPositionX: 0, wholePositionX: -12},
        {type: "black", note: "D#", wholePositionX: -10.6},
        {type: "white", note: "E", topWidth: 1.4, bottomWidth: 2.3, topPositionX: 0.45, wholePositionX: -9.6},
        {type: "white", note: "F", topWidth: 1.3, bottomWidth: 2.4, topPositionX: -0.55, wholePositionX: -7.2},
        {type: "black", note: "F#", wholePositionX: -6.35},
        {type: "white", note: "G", topWidth: 1.3, bottomWidth: 2.3, topPositionX: -0.2, wholePositionX: -4.8},
        {type: "black", note: "G#", wholePositionX: -3.6},
        {type: "white", note: "A", topWidth: 1.3, bottomWidth: 2.3, topPositionX: 0.2, wholePositionX: -2.4},
        {type: "black", note: "A#", wholePositionX: -0.85},
        {type: "white", note: "B", topWidth: 1.3, bottomWidth: 2.4, topPositionX: 0.55, wholePositionX: 0},
    ]

    // 建立TransformNode物件做為鍵盤，之後把按鍵的parent指到此物件
    // 達成類似將物件歸類群組化的方式
    const keyboard = new BABYLON.TransformNode("keyboard");

    // Register 1 through 7
    var referencePositionX = -2.4*14;
    for (let register = 1; register <= 7; register++) {
        keyParams.forEach(key => {
            buildKey(scene, keyboard, Object.assign({register: register, referencePositionX: referencePositionX}, key));
        })
        referencePositionX += 2.4*7;
    }

    // Register 0
    // 最左側的按鍵區域
    buildKey(scene, keyboard, {type: "white", note: "A", topWidth: 1.9, bottomWidth: 2.3, topPositionX: -0.20, wholePositionX: -2.4, register: 0, referencePositionX: -2.4*21});
    keyParams.slice(10, 12).forEach(key => {
        buildKey(scene, keyboard, Object.assign({register: 0, referencePositionX: -2.4*21}, key));
    })

    // Register 8
    // 最右側的按鍵區域
    buildKey(scene, keyboard, {type: "white", note: "C", topWidth: 2.3, bottomWidth: 2.3, topPositionX: 0, wholePositionX: -2.4*6, register: 8, referencePositionX: 84});

    // 建立TransformNode物件做為鋼琴，底下會包含鍵盤/鋼琴frame
    const piano = new BABYLON.TransformNode("piano");
    keyboard.parent = piano;

    // 載入鋼琴frame建模
    BABYLON.SceneLoader.ImportMesh("frame", "https://raw.githubusercontent.com/MicrosoftDocs/mixed-reality/docs/mixed-reality-docs/mr-dev-docs/develop/javascript/tutorials/babylonjs-webxr-piano/files/", "pianoFrame.babylon", scene, function(meshes) {
        const frame = meshes[0];
        frame.parent = piano;
    });

    // 將鋼琴物件往y移動
    keyboard.position.y += 80;

    // 觀察事件
    const pointerToKey = new Map();
    const pianoSound = await Soundfont.instrument(new AudioContext(), 'acoustic_grand_piano');
    scene.onPointerObservable.add((pointerInfo) => {
        switch(pointerInfo.type){
            case BABYLON.PointerEventTypes.POINTERDOWN:
                if (pointerInfo.pickInfo.hit){
                    // 點擊到的mesh物件
                    const pickedMesh = pointerInfo.pickInfo.pickedMesh;
                    // 點擊到的mesh id，其值唯一，做為指標用
                    const pointerId  = pointerInfo.pickInfo.pointerId;
                    // 檢查點擊物件
                    if (pickedMesh.parent === keyboard) {
                        // 壓下去的位移量
                        pickedMesh.position.y -= 0.5;
                        // 儲存點擊的id資訊
                        pointerToKey.set(pointerId, {
                            mesh: pickedMesh,
                            // 依照note name撥放
                            note: pianoSound.play(pointerInfo.pickInfo.pickedMesh.name)
                        });
                    }
                }
                break;

            case BABYLON.PointerEventTypes.POINTERUP:
                // 放開的mesh id，其值唯一，做為指標用
                const pointerId  = pointerInfo.pickInfo.pointerId;
                if (pointerToKey.has(pointerId)){
                    pointerToKey.get(pointerId).mesh.position.y += 0.5;
                    // 釋放點擊的id
                    pointerToKey.delete(pointerId);
                }

                break;
        }
    });

    const xrHelper = await scene.createDefaultXRExperienceAsync();

    return scene;
}
