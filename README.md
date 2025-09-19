# Bit Management - Project Management System

A comprehensive project management system built with Next.js, TypeScript, and Supabase. This system provides team collaboration, task management, project tracking, and real-time notifications.

## Features

### 🎯 Core Features
- **User Authentication** - Secure login/signup with role-based access
- **Project Management** - Create, track, and manage projects
- **Task Management** - Assign tasks, set priorities, and track progress
- **Team Management** - Manage team members and their roles
- **Real-time Notifications** - Get instant updates on project changes
- **Reports & Analytics** - Visual insights into team productivity
- **Responsive Design** - Works on desktop, tablet, and mobile

### 🎨 Design System
- **Dark Theme** - Modern dark UI with custom color palette
- **Consistent Styling** - Tailwind CSS with custom design tokens
- **Accessible** - WCAG compliant components
- **Interactive** - Smooth animations and hover effects

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Charts**: Recharts
- **Icons**: Heroicons
- **State Management**: React Context

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bit-management
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

4. Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. Set up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database-schema.sql`
4. Run the SQL script to create all tables, policies, and functions

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── login/             # Authentication pages
│   ├── signup/
│   ├── forgot-password/
│   ├── projects/          # Project management
│   ├── tasks/             # Task management
│   ├── team/              # Team management
│   ├── reports/           # Analytics & reports
│   ├── notifications/     # Notifications
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   └── layout/           # Layout components
├── contexts/             # React contexts
├── lib/                  # Utility functions
│   └── supabase/        # Supabase configuration
└── types/               # TypeScript type definitions
```

## Database Schema

### Tables

- **users** - User profiles and roles
- **projects** - Project information and status
- **tasks** - Individual tasks with assignments
- **updates** - Project updates and activity feed
- **notifications** - Real-time notifications

### Key Features

- **Row Level Security** - Secure data access
- **Real-time subscriptions** - Live updates
- **Automatic notifications** - Task assignments and status changes
- **Role-based access** - Admin and member permissions

## Usage

### Authentication

1. **Sign Up**: Create a new account (defaults to member role)
2. **Sign In**: Access your dashboard
3. **Password Reset**: Use forgot password functionality

### Project Management

1. **Create Projects**: Add new projects with descriptions and timelines
2. **Track Progress**: Monitor project status and completion
3. **Team Collaboration**: Assign team members to projects

### Task Management

1. **Create Tasks**: Add tasks to projects with priorities and due dates
2. **Assign Tasks**: Assign tasks to team members
3. **Track Status**: Update task status (To Do, In Progress, Done)
4. **Set Priorities**: Mark tasks as Low, Medium, High, or Urgent

### Team Management

1. **View Team**: See all team members and their roles
2. **Manage Roles**: Admins can change user roles
3. **Add Members**: Invite new team members

### Reports & Analytics

1. **Project Status**: Visual breakdown of project statuses
2. **Task Distribution**: Charts showing task completion
3. **Team Activity**: Track individual team member productivity
4. **Monthly Trends**: View completion trends over time

### Notifications

1. **Real-time Updates**: Get instant notifications for:
   - Task assignments
   - Project status changes
   - Team updates
2. **Mark as Read**: Manage notification status
3. **Filter Views**: View all or unread notifications

## Customization

### Color Palette

The system uses a custom color palette defined in `globals.css`:

- **Primary**: Midnight Blue (#1E1F3B), Electric Purple (#8C4DFF)
- **Secondary**: Neon Blue (#00D4FF), Aqua Green (#2FFFC3), Coral (#FF6B6B)
- **Neutral**: Dark Gray (#2C2C3A), Light Gray (#E0E0E0)

### Adding New Features

1. **New Pages**: Add to `src/app/` directory
2. **Components**: Create in `src/components/`
3. **Database Changes**: Update `database-schema.sql`
4. **Types**: Add to `src/types/database.ts`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

---

Built with ❤️ using Next.js and Supabase