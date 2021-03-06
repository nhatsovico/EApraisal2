import { Routes } from '@angular/router';
import { SelfGoalComponent } from './selfgoal.component';

export const selfGoalRoutes: Routes = [
    {
        path: '', component: SelfGoalComponent, children: [
            {path:'', redirectTo:'index', pathMatch:'full'},
            {path: 'index', loadChildren:'./goalindex/goalindex.module#GoalIndexModule' },
            {path:'creategoal', loadChildren:'./creategoal/creategoal.module#CreateGoalModule'}
        ]
    },

]