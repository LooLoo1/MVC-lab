# System Zarządzania Projektami Grupowymi

Aplikacja internetowa do zarządzania projektami grupowymi zbudowana przy użyciu Node.js, Express.js, MongoDB i EJS.

## Funkcjonalności

### Uwierzytelnianie i Autoryzacja
- Rejestracja nowych użytkowników z walidacją danych
- Logowanie z obsługą sesji
- Wylogowanie z czyszczeniem sesji
- Ochrona tras przed nieautoryzowanym dostępem

### Zarządzanie Projektami
- Tworzenie nowych projektów z tytułem, opisem i datami
- Przeglądanie listy projektów z filtrowaniem i sortowaniem
- Edycja szczegółów projektu
- Usuwanie projektów (tylko dla administratorów)
- Śledzenie postępu projektu

### Zarządzanie Zespołami
- Tworzenie zespołów projektowych
- Dodawanie/usuwanie członków zespołu
- Przydzielanie ról w zespole
- Zarządzanie uprawnieniami członków

### Powiadomienia
- System powiadomień o zmianach w projektach
- Powiadomienia o nowych zadaniach
- Powiadomienia o zmianach statusu
- Możliwość konfiguracji powiadomień

### Interfejs Użytkownika
- Responsywny design dostosowany do urządzeń mobilnych
- Intuicyjna nawigacja
- Nowoczesny wygląd z wykorzystaniem Bootstrap 5
- Dostępność (WCAG 2.1)

## Wymagania Systemowe

### Wymagane Wersje
- Node.js: v14.17.0 lub wyższa (zalecana v16.x LTS)
- npm: v6.14.0 lub wyższa (zalecana v8.x)
- MongoDB: v4.4.0 lub wyższa (zalecana v5.x)
- Przeglądarka: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+

### Wymagania Sprzętowe
- Procesor: 1.6 GHz lub szybszy
- RAM: minimum 2GB (zalecane 4GB)
- Dysk: minimum 1GB wolnego miejsca
- Połączenie internetowe: minimum 1 Mbps

## Instalacja

1. Sklonuj repozytorium:
```bash
git clone <adres-repozytorium>
cd system-zarzadzania-projektami
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Utwórz plik `.env` w głównym katalogu z następującą zawartością:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/zarzadzanie-projektami
SESSION_SECRET=twoj-tajny-klucz-zmien-to-w-produkcji
NODE_ENV=development
```

4. Uruchom MongoDB:
```bash
mongod
```

5. Uruchom aplikację:
```bash
# Tryb deweloperski
npm run dev

# Tryb produkcyjny
npm start
```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

## Struktura MVC

### Modele
- User.js - model użytkownika, odpowiada za uwierzytelnianie i zarządzanie użytkownikami
  - Walidacja danych użytkownika
  - Hashowanie haseł
  - Zarządzanie sesjami
- Project.js - model projektu, odpowiada za zarządzanie projektami
  - Walidacja danych projektu
  - Relacje z użytkownikami
  - Śledzenie postępu
- Team.js - model zespołu, odpowiada za zarządzanie zespołami
  - Zarządzanie członkami zespołu
  - Przydzielanie ról
  - Uprawnienia
- Notification.js - model powiadomień, odpowiada za powiadomienia systemowe
  - Typy powiadomień
  - Status powiadomień
  - Priorytety

### Kontrolery
- authController.js - zarządzanie uwierzytelnianiem i autoryzacją
  - Rejestracja
  - Logowanie
  - Wylogowanie
  - Odzyskiwanie hasła
- userController.js - zarządzanie użytkownikami
  - CRUD operacje
  - Zarządzanie profilem
  - Zarządzanie uprawnieniami
- projectController.js - zarządzanie projektami
  - CRUD operacje
  - Zarządzanie zadaniami
  - Śledzenie postępu
- teamController.js - zarządzanie zespołami
  - CRUD operacje
  - Zarządzanie członkami
  - Przydzielanie ról
- notificationController.js - zarządzanie powiadomieniami
  - Tworzenie powiadomień
  - Zarządzanie statusem
  - Filtrowanie

### Widoki
- views/users/ - widoki do zarządzania użytkownikami
  - Rejestracja
  - Logowanie
  - Profil
  - Lista użytkowników
- views/projects/ - widoki do zarządzania projektami
  - Lista projektów
  - Szczegóły projektu
  - Formularz edycji
- views/teams/ - widoki do zarządzania zespołami
  - Lista zespołów
  - Szczegóły zespołu
  - Zarządzanie członkami
- views/notifications/ - widoki powiadomień
  - Lista powiadomień
  - Szczegóły powiadomienia
- views/partials/ - komponenty wielokrotnego użytku
  - Nagłówek
  - Stopka
  - Menu
  - Formularze
- views/layouts/ - szablony stron
  - Główny szablon
  - Panel administracyjny
  - Panel użytkownika

## Przykłady Danych Wejściowych

### Rejestracja Użytkownika
```json
{
  "email": "uzytkownik@przyklad.pl",
  "password": "bezpieczneHaslo123",
  "name": "Jan Kowalski",
  "role": "developer"
}
```

### Tworzenie Projektu
```json
{
  "title": "Rozwój Aplikacji Webowej",
  "description": "Rozwój nowej aplikacji internetowej",
  "startDate": "2024-03-20",
  "endDate": "2024-06-20",
  "teamMembers": ["uzytkownik1@przyklad.pl", "uzytkownik2@przyklad.pl"],
  "priority": "high",
  "status": "in-progress"
}
```

### Tworzenie Zespołu
```json
{
  "name": "Zespół Programistów",
  "description": "Główny zespół programistów",
  "members": ["uzytkownik1@przyklad.pl", "uzytkownik2@przyklad.pl"],
  "roles": {
    "uzytkownik1@przyklad.pl": "team-lead",
    "uzytkownik2@przyklad.pl": "developer"
  }
}
```

## Stylizacja

Projekt wykorzystuje Bootstrap 5 do tworzenia nowoczesnego i responsywnego interfejsu. 
Dodatkowo wykorzystywane są:
- Własne style CSS dla specyficznych komponentów
- Responsywny design dla urządzeń mobilnych
- Nowoczesne komponenty UI (karty, tabele, formularze)
- Animacje i przejścia
- Dostępność (WCAG 2.1)
- Ciemny tryb
- Dostosowanie do różnych rozmiarów ekranu

## Wykorzystane Biblioteki Zewnętrzne

### Backend
- express - framework webowy
- ejs - silnik szablonów
- mongoose - ODM dla MongoDB
- bcryptjs - hashowanie haseł
- express-session - zarządzanie sesjami
- connect-mongo - przechowywanie sesji w MongoDB
- method-override - obsługa metod HTTP
- morgan - logowanie żądań HTTP

### Frontend
- bootstrap - framework CSS
- jquery - manipulacja DOM
- chart.js - wykresy i statystyki
- moment.js - obsługa dat
- sweetalert2 - powiadomienia
- datatables - zaawansowane tabele

## Współpraca

1. Sforkuj repozytorium
2. Utwórz swoją gałąź funkcjonalności (`git checkout -b feature/nowa-funkcjonalnosc`)
3. Zatwierdź swoje zmiany (`git commit -m 'Dodaj nową funkcjonalność'`)
4. Wypchnij zmiany do gałęzi (`git push origin feature/nowa-funkcjonalnosc`)
5. Otwórz Pull Request

## Licencja

Ten projekt jest objęty licencją MIT - szczegóły znajdują się w pliku LICENSE. 