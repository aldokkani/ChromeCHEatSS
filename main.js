console.log('Hello Chess.com!');
const piotr = {
    a: 'a1',
    b: 'b1',
    c: 'c1',
    d: 'd1',
    e: 'e1',
    f: 'f1',
    g: 'g1',
    h: 'h1',
    i: 'a2',
    j: 'b2',
    k: 'c2',
    l: 'd2',
    m: 'e2',
    n: 'f2',
    o: 'g2',
    p: 'h2',
    q: 'a3',
    r: 'b3',
    s: 'c3',
    t: 'd3',
    u: 'e3',
    v: 'f3',
    w: 'g3',
    x: 'h3',
    y: 'a4',
    z: 'b4',
    A: 'c4',
    B: 'd4',
    C: 'e4',
    D: 'f4',
    E: 'g4',
    F: 'h4',
    G: 'a5',
    H: 'b5',
    I: 'c5',
    J: 'd5',
    K: 'e5',
    L: 'f5',
    M: 'g5',
    N: 'h5',
    O: 'a6',
    P: 'b6',
    Q: 'c6',
    R: 'd6',
    S: 'e6',
    T: 'f6',
    U: 'g6',
    V: 'h6',
    W: 'a7',
    X: 'b7',
    Y: 'c7',
    Z: 'd7',
    '0': 'e7',
    '1': 'f7',
    '2': 'g7',
    '3': 'h7',
    '4': 'a8',
    '5': 'b8',
    '6': 'c8',
    '7': 'd8',
    '8': 'e8',
    '9': 'f8',
    '!': 'g8',
    '?': 'h8'
};
let lastArgs;
let sf;
let myTurn = false;

function getKeyByValue(value) {
    return Object.keys(piotr).find(key => piotr[key] === value);
}

function makeMove(move) {
    const newBody = JSON.parse(lastArgs[1].body);
    newBody[0].data.move.move = move;
    newBody[0].data.move.seq += 2;
    delete newBody[0].data.move.clock;
    delete newBody[0].data.move.clockms;
    delete newBody[0].data.move.mht;
    lastArgs[1].body = JSON.stringify(newBody);
    window.fetch(...lastArgs).then();
}

function moveMade(data) {
    for (const ele of data) {
        if (ele.hasOwnProperty('data') && ele?.data?.game?.reason === 'movemade') {
            if (lastArgs && myTurn) {
                calculate(getUCIMoves(ele.data.game.moves), ...ele.data.game.clocks);
            }
            myTurn = true;
        }
    }
}

function calculate(moves, wClock, bClock) {
    if (sf !== undefined) {
        console.log(`go wtime ${wClock} btime ${bClock}`);
        sf.postMessage(`position startpos moves ${moves}`);
        sf.postMessage(`go wtime ${wClock} btime ${bClock}`);
    }
}

function getUCIMoves(moves) {
    return moves
        .split('')
        .map((char, i) => {
            return i % 2 === 0 ? piotr[char] : piotr[char] + ' ';
        })
        .join('');
}

(function(originalFetch) {
    sf = new Worker(
        '/bundles/app/js/vendor/jschessengine/stockfish.6983901b.js#/bundles/app/js/vendor/jschessengine/stockfish.6103b42f.bin'
    );
    console.log('engine')
    sf.onmessage = function onmessage({ data }) {
        if (data.indexOf('bestmove') > -1) {
            let move = data.split(' ')[1];
            move = `${getKeyByValue(move.slice(0, 2))}${getKeyByValue(move.slice(2))}`;
            makeMove(move);
            console.log(data);
        }
    };

    // ========================================================
    window.fetch = function() {
        if (arguments[1].body.indexOf('"channel":"/service/game","data":{"move"') > -1) {
            lastArgs = arguments;
            myTurn = false;
        }
        return new Promise((resolve, reject) => {
            originalFetch
                .apply(this, arguments)
                .then(response => {
                    if (response.url === 'https://live2.chess.com/cometd/connect') {
                        response
                            .clone()
                            .json()
                            .then(moveMade);
                    }
                    resolve(response);
                })
                .catch(error => reject(error));
        });
    };
})(window.fetch);
