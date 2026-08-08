import SwiftUI

public struct RideOptionsView: View {
    @Environment(\.openURL) private var openURL

    public init() {}

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Get Home Safely")
                    .font(.system(size: 18, weight: .black))
                    .foregroundColor(.white)
                Text("Choose a ride option below")
                    .font(.caption)
                    .foregroundColor(.gray)
            }

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                // Uber Card
                Button(action: {
                    if let url = URL(string: "https://m.uber.com") { openURL(url) }
                }) {
                    rideCard(title: "Uber", subtitle: "Book a ride", badgeText: "Uber", badgeBg: Color.black, cardBg: Color.black.opacity(0.8), border: Color.gray.opacity(0.4))
                }

                // Lyft Card
                Button(action: {
                    if let url = URL(string: "https://www.lyft.com") { openURL(url) }
                }) {
                    rideCard(title: "Lyft", subtitle: "Book a ride", badgeText: "lyft", badgeBg: Color.pink, cardBg: Color.purple.opacity(0.3), border: Color.pink.opacity(0.4))
                }

                // Call Friend
                Button(action: {
                    if let url = URL(string: "tel:") { openURL(url) }
                }) {
                    rideCard(title: "Call Friend", subtitle: "Ask a friend", icon: "phone.fill", badgeBg: Color.blue, cardBg: Color.blue.opacity(0.3), border: Color.blue.opacity(0.4))
                }

                // Dial 911 / Taxi Search
                Button(action: {
                    if let url = URL(string: "https://www.google.com/search?q=taxi+rideshare+near+me") { openURL(url) }
                }) {
                    rideCard(title: "More Options", subtitle: "Explore taxis", icon: "magnifyingglass", badgeBg: Color.gray, cardBg: Color.white.opacity(0.08), border: Color.gray.opacity(0.3))
                }
            }
        }
    }

    private func rideCard(title: String, subtitle: String, badgeText: String? = nil, icon: String? = nil, badgeBg: Color, cardBg: Color, border: Color) -> View {
        VStack(spacing: 8) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(badgeBg)
                    .frame(width: 44, height: 44)

                if let text = badgeText {
                    Text(text)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)
                } else if let ic = icon {
                    Image(systemName: ic)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                }
            }

            VStack(spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
                Text(subtitle)
                    .font(.system(size: 10))
                    .foregroundColor(.gray)
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: 105)
        .background(cardBg)
        .cornerRadius(20)
        .overlay(RoundedRectangle(cornerRadius: 20).stroke(border, lineWidth: 1.5))
    }
}
