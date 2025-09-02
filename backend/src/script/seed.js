import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { UserModel } from '../model/user.js';
import { LeadModel } from '../model/lead.js';
import { CustomerModel } from '../model/customer.js';
import { TaskModel } from '../model/task.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const seedData = async () => {
  try {
    const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    console.log(' Starting seed process...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log(' Connected to database');


    // Create admin user
    console.log(' Creating admin user...');
    const adminPassword = await bcrypt.hash('Admin@123', BCRYPT_SALT_ROUNDS);
    const admin = await UserModel.create({
      name: 'admin',
      emailId: 'admin@gmail.com',
      password: adminPassword,
      role: 'Admin'
    });

    // Create agent users
    console.log('👨‍💼 Creating agent users...');
    const agent1Password = await bcrypt.hash('Rahul@123', BCRYPT_SALT_ROUNDS);
    const agent1 = await UserModel.create({
      name: 'Rahul',
      emailId: 'rahul@gmail.com',
      password: agent1Password,
      role: 'Agent'
    });

    const agent2Password = await bcrypt.hash('Shivam@123', BCRYPT_SALT_ROUNDS);
    const agent2 = await UserModel.create({
      name: 'Shivam',
      emailId: 'shivam@gmail.com',
      password: agent2Password,
      role: 'Agent'
    });

    // Create 10 leads
    console.log('📞 Creating 10 leads...');
    const leads = [];
    const leadStatuses = ["New", "In Progress", "Closed Won", "Closed Lost"];
    const leadSources = ["Web", "Referral", "Social Media", "Email", "Event"];
    
    for (let i = 1; i <= 10; i++) {
      const lead = await LeadModel.create({
        name: `Lead ${i}`,
        emailId: `lead${i}@gmail.com`,
        phone: `99911123${i.toString().padStart(2, '0')}`,
        status: leadStatuses[i % 4],
        source: leadSources[i % 5],
        assignedAgent: [agent1._id, agent2._id][i % 2],
        isArchived: i === 10 // Archive the last lead for demo
      });
      leads.push(lead);
    }

    // Create 5 customers
    console.log(' Creating 5 customers...');
    const customers = [];
    const companies = ["Airtel", "Jio", "Tata", "Stark Industries", "Mahindra Industries"];

    for (let i = 1; i <= 5; i++) {
      const customer = await CustomerModel.create({
        name: `Customer ${i}`,
        emailId: `customer${i}@gmail.com`,
        phone: `97193727${i.toString().padStart(2, '0')}`,
        company: companies[i - 1],
        owner: [agent1._id, agent2._id][i % 2],
        tags: i % 2 === 0 ? ["VIP", "Enterprise"] : ["Standard"],
        notes: [
          {
            text: `Initial contact made on ${new Date().toLocaleDateString()}`,
            createdBy: admin._id
          }
        ],
        isArchived: i === 5 // Archive the last customer for demo
      });
      customers.push(customer);
    }

    // Create some tasks
    console.log('✅ Creating sample tasks...');
    const tasks = [];
    const taskTitles = [
      "Follow up with client",
      "Prepare proposal",
      "Schedule meeting",
      "Send contract",
      "Review requirements"
    ];
    
    for (let i = 0; i < 5; i++) {
      const task = await TaskModel.create({
        title: taskTitles[i],
        dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), // 1-5 days from now
        status: ["Open", "In Progress", "Open", "Done", "Open"][i],
        priority: ["High", "Medium", "Low", "Medium", "High"][i],
        relatedTo: i < 3 ? leads[i]._id : customers[i - 3]._id,
        relatedModel: i < 3 ? "Lead" : "Customer",
        owner: [agent1._id, agent2._id][i % 2]
      });
      tasks.push(task);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
};

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: npm run seed [options]

Options:
  --help, -h     Show this help message
  --force        Force seed even in production (use with caution)
  `);
  process.exit(0);
}

// Check if we're in production and no force flag
if (process.env.NODE_ENV === 'production' && !args.includes('--force')) {
  console.error('❌ Cannot seed in production without --force flag');
  process.exit(1);
}

seedData();