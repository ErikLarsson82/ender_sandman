define('app/level', [], function() {
  return {
    getLevel: function(idx) {
        var a = 'a'
        
        var maps = [
            [
                [2,2,2,2,2,2,2,2,5,2,2,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2,2,9, , ,1,a, , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2,2,2,2,2,2,2,2,2,2,2,2],
                [6,7,8]
            ],
            [
                [2,2,2,2,2,2,2,2,5,2,2,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, ,a, , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2,2,9, , ,1,a, , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , ,a, ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2,2,2,2,2,2,2,2,2,2,2,2],
                [6,7,8]
            ],
            [
                [2,2,2,2,2,2,2,2,5,2,2,2],
                [2, , , , , ,a, , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, ,a, , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2,2,9, , ,1,a, , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , ,a, ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , ,a, , , , , ,2],
                [2,2,2,2,2,2,2,2,2,2,2,2],
                [6,7,8]
            ],
            [
                [2,2,2,2,2,2,2,2,5,2,2,2],
                [2, , ,a, , , , ,1, , ,2],
                [2, , , , , , , , , ,a,2],
                [2, ,a, , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2,2,9, , , ,a, , , , ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , ,a, , ,2],
                [2, ,a, , , , , , , , ,2],
                [2, , , , , , , , ,a, ,2],
                [2, , , , , , , , , , ,2],
                [2, , , , , , , , , , ,2],
                [2,2,2,2,2,2,2,2,2,2,2,2],
                [6,7,8]
            ]
        ]
            /*
            [2,2,2,2,2,2,2,2,2,2,2,2],
            [2, , , , , , , , , , ,2],
            [2, , , , , , , , , , ,2],
            [2, , , ,3, , , , , , ,2],
            [2, , , , , , , , ,1, ,2],
            [2, , , , , , , , , , ,2],
            [2, , , , , , , , , , ,2],
            [2, , , , , , , , , , ,2],
            [2,2,9, , , , , , , , ,2],
            [2, , , , , , , , , , ,2],
            [2, , , , , , , , , , ,2],
            [2, , , , , , , , , , ,2],
            [2, , , , , ,3, , ,3, ,2],
            [2, , , , , , , , , , ,2],
            [2, ,4, , , , , , , , ,2],
            [2,2,2,2,2,2,2,2,2,2,2,2],
            [ , , , , , , , , , , , ],
            [ , , , , , , , , , , , ],
            [ , , , , , , , , , , , ],
            [ , , , , , , , , , , , ],
            [ , , , , , , , , , , , ],
            [ , , , , , , , , , , , ],
            [ , , , , , , , , , , , ],
            [ , , , , , , , , , , , ],
            [ , , , , , , , ,1, , , ],
            [ , , , , , , , , , , , ],
            [ , , , , , , , , , , , ],
            [ , , , , , , , , , , , ],
            [ , , , , , , , , , , , ],
            [ , , , , , , , , , , , ],
            [ , , , , , , , , , , , ],
            [ , , , , , , , , , , , ],
            */
        return maps[idx]
    }
  }
})