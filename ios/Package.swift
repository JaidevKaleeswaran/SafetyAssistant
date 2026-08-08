// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "SafetyBuddy",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .executable(name: "SafetyBuddy", targets: ["SafetyBuddy"])
    ],
    targets: [
        .executableTarget(
            name: "SafetyBuddy",
            path: "SafetyBuddy"
        )
    ]
)
