let string = "https://something.com"

let path = ["another", "way"]

let super_string = [string, ...path].join("/") //?

"" + path //?
path.map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(" ") //?
!isNaN(parseInt(path.slice(-1).toString())) //?
