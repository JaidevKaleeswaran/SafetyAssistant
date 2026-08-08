import SwiftUI

public struct LandingView: View {
    public var onStart: () -> Void
    @State private var animateBadge = false
    @State private var animateParticles = false

    public init(onStart: @escaping () -> Void) {
        self.onStart = onStart
    }

    public var body: some View {
        ZStack {
            // Background Mesh Gradient
            LinearGradient(
                colors: [Color(red: 0.05, green: 0.07, blue: 0.12), Color(red: 0.08, green: 0.12, blue: 0.22), Color(red: 0.03, green: 0.05, blue: 0.10)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Floating Background Particles
            GeometryReader { geo in
                ForEach(0..<6, id: \.self) { i in
                    Circle()
                        .fill(Color.blue.opacity(0.15 + Double(i) * 0.03))
                        .frame(width: CGFloat(6 + i * 4), height: CGFloat(6 + i * 4))
                        .position(
                            x: geo.size.width * CGFloat(0.15 + Double(i) * 0.14),
                            y: geo.size.height * CGFloat(0.2 + Double(i) * 0.1) + (animateParticles ? -25 : 15)
                        )
                        .animation(
                            Animation.easeInOut(duration: Double(3 + i))
                                .repeatForever(autoreverses: true)
                                .delay(Double(i) * 0.3),
                            value: animateParticles
                        )
                }
            }
            .ignoresSafeArea()
            .onAppear {
                animateParticles = true
            }

            VStack(spacing: 24) {
                Spacer()

                // Hero Glowing Badge (Shield + Brain)
                ZStack(alignment: .topTrailing) {
                    RoundedRectangle(cornerRadius: 32, style: .continuous)
                        .fill(LinearGradient(colors: [Color.blue, Color.teal], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 104, height: 104)
                        .shadow(color: Color.blue.opacity(0.6), radius: 24, x: 0, y: 10)
                        .overlay(
                            Image(systemName: "shield.fill")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 52, height: 52)
                                .foregroundColor(.white)
                        )

                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(LinearGradient(colors: [Color.emerald, Color.teal], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 36, height: 36)
                        .overlay(
                            Image(systemName: "brain.head.profile")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 18, height: 18)
                                .foregroundColor(.white)
                        )
                        .offset(x: 8, y: -8)
                        .scaleEffect(animateBadge ? 1.1 : 0.95)
                        .animation(Animation.easeInOut(duration: 1.8).repeatForever(autoreverses: true), value: animateBadge)
                }

                // Title
                VStack(spacing: 8) {
                    Text("SafetyBuddy")
                        .font(.system(size: 48, weight: .black, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(colors: [.white, Color(white: 0.85)], startPoint: .top, endPoint: .bottom)
                        )
                        .shadow(color: Color.blue.opacity(0.5), radius: 12, x: 0, y: 4)

                    Text("One minute. One assessment. One safe decision. Many lives saved.")
                        .font(.system(size: 16, weight: .regular))
                        .foregroundColor(Color(red: 0.6, green: 0.65, blue: 0.75))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 36)
                }

                Spacer()

                // Wide Action Button
                Button(action: onStart) {
                    VStack(spacing: 10) {
                        Image(systemName: "shield.checkmark.fill")
                            .font(.system(size: 36))
                            .foregroundColor(.white)

                        HStack(spacing: 8) {
                            Text("Start Assessment")
                                .font(.system(size: 22, weight: .bold, design: .rounded))
                            Image(systemName: "arrow.right")
                                .font(.system(size: 20, weight: .bold))
                        }
                        .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 160)
                    .background(
                        LinearGradient(colors: [Color(red: 0.2, green: 0.45, blue: 0.95), Color(red: 0.12, green: 0.35, blue: 0.85)], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    .cornerRadius(28)
                    .overlay(
                        RoundedRectangle(cornerRadius: 28)
                            .stroke(Color.white.opacity(0.3), lineWidth: 1.5)
                    )
                    .shadow(color: Color.blue.opacity(0.5), radius: 20, x: 0, y: 10)
                }
                .padding(.horizontal, 28)

                Spacer()

                // Author Credit anchored at bottom
                VStack(spacing: 2) {
                    Text("BY")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(Color.gray)
                        .tracking(3)
                    Text("Jaidev Kaleeswaran")
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundColor(.white)
                        .shadow(color: Color.blue.opacity(0.7), radius: 10, x: 0, y: 0)
                }
                .padding(.bottom, 24)
            }
        }
        .onAppear {
            animateBadge = true
        }
    }
}
